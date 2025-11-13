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
          p.id, p.name, p.description, p.price, p.stock_quantity, p.status, p.vendor, p.long_description, p.benefits, p.how_to_use, p.comparedprice, p.ingredients, p.brand_id,
          b.name as "brandName",
          pi.image_url as "imageUrl"
        FROM
          products p
        LEFT JOIN
          brands b ON p.brand_id = b.id
        LEFT JOIN
          product_images pi ON p.id = pi.product_id AND pi.is_main = TRUE
        WHERE pi.created_at >= NOW() - INTERVAL '7 days'
        ORDER BY pi.created_at DESC
      `;
    } else {
      sql = `
        SELECT
          p.id, p.name, p.description, p.price, p.stock_quantity, p.status, p.vendor, p.long_description, p.benefits, p.how_to_use, p.comparedprice, p.ingredients, p.brand_id,
          b.name as "brandName",
          pi.image_url as "imageUrl",
          STRING_AGG(c.name, ', ') as "categoryNames"
        FROM
          products p
        LEFT JOIN
          brands b ON p.brand_id = b.id
        LEFT JOIN
          product_images pi ON p.id = pi.product_id AND pi.is_main = TRUE
        LEFT JOIN
          category_products cp ON p.id = cp.product_id
        LEFT JOIN
          categories c ON cp.category_id = c.id
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

      sql += ` GROUP BY p.id, b.name, pi.image_url`;
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

    const productSql = `
      INSERT INTO products (name, description, price, stock_quantity, status, vendor, long_description, benefits, how_to_use, comparedprice, ingredients, brand_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id;
    `;
    const productValues = [name, description, price, stock_quantity, status, vendorName, long_description, benefits, how_to_use, comparedprice, ingredients, brand_id];
    const { rows: productRows } = await client.query(productSql, productValues);
    const productId = productRows[0].id;

    const categoryIds = categoryIdsString.split(',').map(id => parseInt(id.trim()));
    if (categoryIds.length > 0) {
      const categoryProductValues = categoryIds.map(catId => `(${catId}, ${productId})`).join(',');
      await client.query(`INSERT INTO category_products (category_id, product_id) VALUES ${categoryProductValues}`);
    }

    const mainImageFile = formData.get('mainImage');
    if (mainImageFile && mainImageFile.size > 0) {
      const imageBuffer = Buffer.from(await mainImageFile.arrayBuffer());
      const uploadResult = await uploadImageToCloudinary(imageBuffer);
      await client.query('INSERT INTO product_images (product_id, image_url, is_main) VALUES ($1, $2, TRUE)', [productId, uploadResult.secure_url]);
    }

    const additionalImageFiles = formData.getAll('additionalImages');
    for (const imageFile of additionalImageFiles) {
      if (imageFile && imageFile.size > 0) {
        const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
        const uploadResult = await uploadImageToCloudinary(imageBuffer);
        await client.query('INSERT INTO product_images (product_id, image_url, is_main) VALUES ($1, $2, FALSE)', [productId, uploadResult.secure_url]);
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