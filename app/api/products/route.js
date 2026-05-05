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
  const isAdmin = searchParams.get('admin') === 'true';

  try {
    let sql;
    const params = [];

    // Base selection for all branches
    const baseSelection = `
      p.id, p.name, p.slug, p.description, p.price, p.stock_quantity, p.status, p.vendor, p.long_description, p.benefits, p.how_to_use, p.how_to_use_video, p.comparedprice, p.ingredients, p.brand_id, p.size, p.form,
      b.name as "brandName", b.name as "brand", b.imageurl as "brandImageUrl",
      (SELECT image_url FROM product_images WHERE product_id = p.id AND is_main = TRUE LIMIT 1) as "imageUrl",
      (SELECT alt_text FROM product_images WHERE product_id = p.id AND is_main = TRUE LIMIT 1) as "altText",
      (SELECT JSON_AGG(JSON_BUILD_OBJECT('url', image_url, 'alt', alt_text)) FROM product_images WHERE product_id = p.id AND is_main = FALSE) as "additionalImagesData",
      COALESCE((SELECT AVG(rating) FROM reviews WHERE product_id = p.id), 0)::numeric(10,1) as "averageRating",
      (SELECT COUNT(*) FROM reviews WHERE product_id = p.id) as "reviewCount"
    `;

    if (isNew === 'true') {
        sql = `
          SELECT ${baseSelection}
          FROM products p
          LEFT JOIN brands b ON p.brand_id = b.id
          WHERE p.id IS NOT NULL${isAdmin ? '' : " AND p.is_active = true AND (p.status = 'active' OR p.status IS NULL)"}
          ORDER BY p.id DESC
        `;
    } else {
      sql = `
        SELECT ${baseSelection}
        FROM products p
        LEFT JOIN brands b ON p.brand_id = b.id
      `;
      let whereClauses = [];

      if (!isAdmin) {
        whereClauses.push('p.is_active = true');
        whereClauses.push("(p.status = 'active' OR p.status IS NULL)");
      }

      if (categoryIdsParam) {
        const ids = categoryIdsParam.split(',').map(id => parseInt(id.trim()));
        if (ids.length > 0) {
          whereClauses.push(`p.id IN (SELECT product_id FROM category_products WHERE category_id IN (${ids.map((_, i) => `$${params.length + 1 + i}`).join(',')}))`);
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
    }

    if (random === 'true') {
      sql += ` ORDER BY RANDOM()`;
    } else if (isNew !== 'true') {
      sql += ` ORDER BY p.id DESC`;
    }

    if (limit) {
      sql += ` LIMIT $${params.length + 1}`;
      params.push(parseInt(limit));
    }

    let rows;
    try {
        const result = await db.query(sql, params.length > 0 ? params : undefined);
        rows = result.rows;
    } catch (dbError) {
        console.error('Initial DB query failed:', dbError.message);
        let retrySql = sql;
        if (dbError.message.includes('is_active')) {
            retrySql = retrySql.replace(/AND p\.is_active = true/g, '');
            retrySql = retrySql.replace(/p\.is_active = true AND /g, '');
            retrySql = retrySql.replace(/WHERE p\.is_active = true/g, 'WHERE 1=1');
        }
        const result = await db.query(retrySql, params.length > 0 ? params : undefined);
        rows = result.rows;
    }

    // Hydrate additional data (categories, concerns) for each product
    // Note: For large lists, this should be optimized with a single query using IN (...)
    if (rows.length > 0) {
        const productIds = rows.map(p => p.id);
        
        try {
            const { rows: catRows } = await db.query(`
                SELECT cp.product_id, cp.category_id, c.name 
                FROM category_products cp 
                JOIN categories c ON cp.category_id = c.id 
                WHERE cp.product_id = ANY($1)
            `, [productIds]);
            
            rows.forEach(p => {
                const pCats = catRows.filter(c => c.product_id === p.id);
                p.category_ids = pCats.map(c => c.category_id);
                p.categoryNames = pCats.map(c => c.name).join(', ');
            });
        } catch (e) { console.warn('Could not hydrate categories'); }

        try {
            const { rows: concernRows } = await db.query(`
                SELECT product_id, concern_id 
                FROM product_concerns 
                WHERE product_id = ANY($1)
            `, [productIds]);
            
            rows.forEach(p => {
                p.concern_ids = concernRows.filter(c => c.product_id === p.id).map(c => c.concern_id);
            });
        } catch (e) { console.warn('Could not hydrate concerns'); }
    }

    const headers = (!isAdmin && random !== 'true')
      ? { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' }
      : {};
    return NextResponse.json(rows, { headers });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ message: 'Error fetching products from database', error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const client = await db.connect();
  try {
    const formData = await request.formData();
    const data = Object.fromEntries(formData.entries());
    const { 
        name, description, price: priceRaw, stock_quantity: stock_quantityRaw, status, 
        long_description, benefits, how_to_use, how_to_use_video, 
        comparedprice: comparedpriceRaw, ingredients, brand_id, size, form,
        categoryIds: categoryIdsString, concernIds: concernIdsString 
    } = data;

    if (!name || !priceRaw || !stock_quantityRaw || !categoryIdsString) {
      return NextResponse.json({ message: 'Missing required fields (name, price, stock_quantity, categoryIds).' }, { status: 400 });
    }

    const price = parseFloat(priceRaw) || 0;
    const stock_quantity = parseInt(stock_quantityRaw, 10) || 0;
    const comparedprice = (comparedpriceRaw && comparedpriceRaw !== '') ? parseFloat(comparedpriceRaw) : null;

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
      INSERT INTO products (name, slug, description, price, stock_quantity, status, vendor, long_description, benefits, how_to_use, how_to_use_video, comparedprice, ingredients, brand_id, size, form)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING id;
    `;
    const productValues = [name, slug, description, price, stock_quantity, status, vendorName, long_description, benefits, how_to_use, how_to_use_video || null, comparedprice, ingredients, brand_id, size, form];
    const { rows: productRows } = await client.query(productSql, productValues);
    const productId = productRows[0].id;

    const categoryIds = categoryIdsString.split(',').map(id => parseInt(id.trim()));
    if (categoryIds.length > 0) {
      const categoryProductValues = categoryIds.map(catId => `(${catId}, ${productId})`).join(',');
      await client.query(`INSERT INTO category_products (category_id, product_id) VALUES ${categoryProductValues}`);
    }

    if (concernIdsString) {
      const concernIds = concernIdsString.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      if (concernIds.length > 0) {
        try {
            const concernProductValues = concernIds.map(conId => `(${conId}, ${productId})`).join(',');
            await client.query(`INSERT INTO product_concerns (concern_id, product_id) VALUES ${concernProductValues}`);
        } catch (e) {
            console.warn('Could not save product concerns, table might be missing.');
        }
      }
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