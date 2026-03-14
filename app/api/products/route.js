import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { uploadImageToCloudinary } from '@/lib/cloudinary';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const random = searchParams.get('random');
  const limit = searchParams.get('limit');
  const categoryIdsParam = searchParams.get('categoryIds');
  const isNew = searchParams.get('isNew');
  const brandId = searchParams.get('brandId');
  const searchQuery = searchParams.get('search');

  try {
    let sql;
    const params = [];

    if (isNew === 'true') {
            sql = `
              SELECT
                p.id, p.name, p.slug, p.description, p.price, p.stock_quantity, p.status, p.vendor, p.long_description, p.benefits, p.how_to_use, p.comparedprice, p.ingredients, p.brand_id,
                b.name as "brandName",
                (SELECT image_url FROM product_images WHERE product_id = p.id AND is_main = TRUE LIMIT 1) as "imageUrl",
                (SELECT alt_text FROM product_images WHERE product_id = p.id AND is_main = TRUE LIMIT 1) as "altText",
                (SELECT JSON_AGG(JSON_BUILD_OBJECT('url', image_url, 'alt', alt_text)) FROM product_images WHERE product_id = p.id AND is_main = FALSE) as "additionalImagesData",
                COALESCE(AVG(r.rating), 0)::numeric(10,1) as "averageRating",
                COUNT(r.id) as "reviewCount"
              FROM
                products p
              LEFT JOIN
                brands b ON p.brand_id = b.id
              LEFT JOIN
                reviews r ON p.id = r.product_id
              WHERE p.id IS NOT NULL
              GROUP BY p.id, p.name, p.slug, p.description, p.price, p.stock_quantity, p.status, p.vendor, p.long_description, p.benefits, p.how_to_use, p.comparedprice, p.ingredients, p.brand_id, b.name
              ORDER BY p.id DESC
            `;    } else {
      sql = `
        SELECT
          p.id, p.name, p.slug, p.description, p.price, p.stock_quantity, p.status, p.vendor, p.long_description, p.benefits, p.how_to_use, p.comparedprice, p.ingredients, p.brand_id,
          b.name as "brandName",
          (SELECT image_url FROM product_images WHERE product_id = p.id AND is_main = TRUE LIMIT 1) as "imageUrl",
          (SELECT alt_text FROM product_images WHERE product_id = p.id AND is_main = TRUE LIMIT 1) as "altText",
          (SELECT JSON_AGG(JSON_BUILD_OBJECT('url', image_url, 'alt', alt_text)) FROM product_images WHERE product_id = p.id AND is_main = FALSE) as "additionalImagesData",
          COALESCE(AVG(r.rating), 0)::numeric(10,1) as "averageRating",
          COUNT(r.id) as "reviewCount",
          STRING_AGG(DISTINCT c.name, ', ') as "categoryNames",
          ARRAY_AGG(DISTINCT cp.category_id) as "category_ids"
        FROM
          products p
        LEFT JOIN
          brands b ON p.brand_id = b.id
        LEFT JOIN
          category_products cp ON p.id = cp.product_id
        LEFT JOIN
          categories c ON cp.category_id = c.id
        LEFT JOIN
          reviews r ON p.id = r.product_id
      `;
      let whereClauses = [];

      if (categoryIdsParam) {
        const ids = categoryIdsParam.split(',').map(id => parseInt(id.trim()));
        if (ids.length > 0) {
          whereClauses.push(`cp.category_id IN (${ids.map((_, i) => `$${params.length + 1 + i}`).join(',')})`);
          params.push(...ids);
        }
      }

      if (brandId) {
        whereClauses.push(`p.brand_id = $${params.length + 1}`);
        params.push(parseInt(brandId));
      }

      if (searchQuery) {
        whereClauses.push(`(p.name ILIKE $${params.length + 1} OR p.description ILIKE $${params.length + 1} OR b.name ILIKE $${params.length + 1})`);
        params.push(`%${searchQuery}%`);
      }

      if (whereClauses.length > 0) {
        sql += ` WHERE ${whereClauses.join(' AND ')}`;
      }

      sql += ` GROUP BY p.id, p.name, p.slug, p.description, p.price, p.stock_quantity, p.status, p.vendor, p.long_description, p.benefits, p.how_to_use, p.comparedprice, p.ingredients, p.brand_id, b.name`;
    }

    if (random === 'true') {
      sql += ` ORDER BY RANDOM()`;
    }

    if (limit) {
      sql += ` LIMIT $${params.length + 1}`;
      params.push(parseInt(limit));
    }

    const { rows } = await db.query(sql, params.length > 0 ? params : undefined);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ message: 'Error fetching products from database', error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const client = await db.connect();
  try {
    const formData = await request.formData();
    const { name, description, price, stock_quantity, status, long_description, benefits, how_to_use, comparedprice, ingredients, brand_id, categoryIds: categoryIdsString } = Object.fromEntries(formData.entries());

    if (!name || !price || !stock_quantity || !categoryIdsString) {
      return NextResponse.json({ message: 'Missing required fields (name, price, stock_quantity, categoryIds).' }, { status: 400 });
    }

    await client.query('BEGIN');

    let vendorName = null;
    if (brand_id) {
      const { rows: brandRows } = await client.query('SELECT name FROM brands WHERE id = $1', [brand_id]);
      if (brandRows.length > 0) vendorName = brandRows[0].name;
    }

    // Generate slug for new product
    const slugify = (text) => text.toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-');
    let baseSlug = slugify(name);
    let slug = baseSlug;
    let counter = 1;
    while (true) {
        const { rows: existing } = await client.query('SELECT id FROM products WHERE slug = $1', [slug]);
        if (existing.length === 0) break;
        slug = `${baseSlug}-${counter}`;
        counter++;
    }

    const productSql = `
      INSERT INTO products (name, slug, description, price, stock_quantity, status, vendor, long_description, benefits, how_to_use, comparedprice, ingredients, brand_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id;
    `;
    const productValues = [name, slug, description, price, stock_quantity, status, vendorName, long_description, benefits, how_to_use, comparedprice, ingredients, brand_id];
    const { rows: productRows } = await client.query(productSql, productValues);
    const productId = productRows[0].id;

    const categoryIds = categoryIdsString.split(',').map(id => parseInt(id.trim()));
    if (categoryIds.length > 0) {
      const categoryProductValues = categoryIds.map(catId => `(${catId}, ${productId})`).join(',');
      await client.query(`INSERT INTO category_products (category_id, product_id) VALUES ${categoryProductValues}`);
    }

    const mainImageFile = formData.get('mainImage');
    const mainAltText = formData.get('mainAltText') || '';
    if (mainImageFile && mainImageFile.size > 0) {
      const imageBuffer = Buffer.from(await mainImageFile.arrayBuffer());
      const uploadResult = await uploadImageToCloudinary(imageBuffer);
      await client.query('INSERT INTO product_images (product_id, image_url, is_main, alt_text) VALUES ($1, $2, TRUE, $3)', [productId, uploadResult.secure_url, mainAltText]);
    }

    const additionalImageFiles = formData.getAll('additionalImages');
    const additionalAlts = formData.getAll('additionalAlts');
    for (let i = 0; i < additionalImageFiles.length; i++) {
      const imageFile = additionalImageFiles[i];
      const altText = additionalAlts[i] || '';
      if (imageFile && imageFile.size > 0) {
        const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
        const uploadResult = await uploadImageToCloudinary(imageBuffer);
        await client.query('INSERT INTO product_images (product_id, image_url, is_main, alt_text) VALUES ($1, $2, FALSE, $3)', [productId, uploadResult.secure_url, altText]);
      }
    }

    await client.query('COMMIT');
    return NextResponse.json({ message: 'Product added successfully', productId }, { status: 201 });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adding product:', error);
    return NextResponse.json({ message: 'Error adding product to database', error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}