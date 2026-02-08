import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import db from '../db';
import { authenticate, optionalAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// Validation schemas
const recipeSchema = z.object({
  title: z.string().min(1, '제목을 입력하세요.'),
  description: z.string().optional(),
  ingredients: z.array(z.string()).min(1, '재료를 입력하세요.'),
  instructions: z.array(z.string()).min(1, '조리 방법을 입력하세요.'),
  cookingTime: z.number().optional(),
  servings: z.number().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  imageUrl: z.string().optional(),
});

// Get all recipes
router.get('/', optionalAuth, (req: AuthRequest, res) => {
  const { page = 1, limit = 10, search } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  let query = `
    SELECT
      r.*,
      u.nickname as author_nickname,
      u.profile_image as author_image,
      (SELECT COUNT(*) FROM likes WHERE recipe_id = r.id) as like_count,
      (SELECT COUNT(*) FROM comments WHERE recipe_id = r.id) as comment_count
  `;

  if (req.user) {
    query += `, (SELECT COUNT(*) FROM likes WHERE recipe_id = r.id AND user_id = ?) as is_liked`;
  }

  query += `
    FROM recipes r
    JOIN users u ON r.user_id = u.id
  `;

  const params: any[] = req.user ? [req.user.id] : [];

  if (search) {
    query += ` WHERE r.title LIKE ? OR r.description LIKE ?`;
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ` ORDER BY r.created_at DESC LIMIT ? OFFSET ?`;
  params.push(Number(limit), offset);

  const recipes = db.prepare(query).all(...params);

  // Get total count
  let countQuery = 'SELECT COUNT(*) as total FROM recipes';
  const countParams: any[] = [];
  if (search) {
    countQuery += ' WHERE title LIKE ? OR description LIKE ?';
    countParams.push(`%${search}%`, `%${search}%`);
  }
  const { total } = db.prepare(countQuery).get(...countParams) as any;

  res.json({
    success: true,
    data: {
      recipes: recipes.map((r: any) => ({
        ...r,
        ingredients: JSON.parse(r.ingredients),
        instructions: JSON.parse(r.instructions),
        isLiked: req.user ? r.is_liked > 0 : false,
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    },
  });
});

// Get single recipe
router.get('/:id', optionalAuth, (req: AuthRequest, res) => {
  let query = `
    SELECT
      r.*,
      u.nickname as author_nickname,
      u.profile_image as author_image,
      (SELECT COUNT(*) FROM likes WHERE recipe_id = r.id) as like_count,
      (SELECT COUNT(*) FROM comments WHERE recipe_id = r.id) as comment_count
  `;

  const params: any[] = [];

  if (req.user) {
    query += `, (SELECT COUNT(*) FROM likes WHERE recipe_id = r.id AND user_id = ?) as is_liked`;
    params.push(req.user.id);
  }

  query += `
    FROM recipes r
    JOIN users u ON r.user_id = u.id
    WHERE r.id = ?
  `;
  params.push(req.params.id);

  const recipe = db.prepare(query).get(...params) as any;

  if (!recipe) {
    return res.status(404).json({ error: '레시피를 찾을 수 없습니다.' });
  }

  // Get comments
  const comments = db.prepare(`
    SELECT c.*, u.nickname, u.profile_image
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.recipe_id = ?
    ORDER BY c.created_at DESC
  `).all(req.params.id);

  res.json({
    success: true,
    data: {
      ...recipe,
      ingredients: JSON.parse(recipe.ingredients),
      instructions: JSON.parse(recipe.instructions),
      isLiked: req.user ? recipe.is_liked > 0 : false,
      comments,
    },
  });
});

// Create recipe
router.post('/', authenticate, (req: AuthRequest, res) => {
  try {
    const data = recipeSchema.parse(req.body);
    const id = uuidv4();

    db.prepare(`
      INSERT INTO recipes (id, user_id, title, description, ingredients, instructions, cooking_time, servings, difficulty, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      req.user!.id,
      data.title,
      data.description || null,
      JSON.stringify(data.ingredients),
      JSON.stringify(data.instructions),
      data.cookingTime || null,
      data.servings || null,
      data.difficulty || null,
      data.imageUrl || null
    );

    res.status(201).json({
      success: true,
      data: { id },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    throw error;
  }
});

// Update recipe
router.put('/:id', authenticate, (req: AuthRequest, res) => {
  try {
    const data = recipeSchema.parse(req.body);

    // Check ownership
    const recipe = db
      .prepare('SELECT user_id FROM recipes WHERE id = ?')
      .get(req.params.id) as any;

    if (!recipe) {
      return res.status(404).json({ error: '레시피를 찾을 수 없습니다.' });
    }

    if (recipe.user_id !== req.user!.id) {
      return res.status(403).json({ error: '수정 권한이 없습니다.' });
    }

    db.prepare(`
      UPDATE recipes
      SET title = ?, description = ?, ingredients = ?, instructions = ?,
          cooking_time = ?, servings = ?, difficulty = ?, image_url = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      data.title,
      data.description || null,
      JSON.stringify(data.ingredients),
      JSON.stringify(data.instructions),
      data.cookingTime || null,
      data.servings || null,
      data.difficulty || null,
      data.imageUrl || null,
      req.params.id
    );

    res.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    throw error;
  }
});

// Delete recipe
router.delete('/:id', authenticate, (req: AuthRequest, res) => {
  const recipe = db
    .prepare('SELECT user_id FROM recipes WHERE id = ?')
    .get(req.params.id) as any;

  if (!recipe) {
    return res.status(404).json({ error: '레시피를 찾을 수 없습니다.' });
  }

  if (recipe.user_id !== req.user!.id) {
    return res.status(403).json({ error: '삭제 권한이 없습니다.' });
  }

  db.prepare('DELETE FROM recipes WHERE id = ?').run(req.params.id);

  res.json({ success: true });
});

// Like recipe
router.post('/:id/like', authenticate, (req: AuthRequest, res) => {
  const recipe = db
    .prepare('SELECT id FROM recipes WHERE id = ?')
    .get(req.params.id);

  if (!recipe) {
    return res.status(404).json({ error: '레시피를 찾을 수 없습니다.' });
  }

  const existingLike = db
    .prepare('SELECT id FROM likes WHERE user_id = ? AND recipe_id = ?')
    .get(req.user!.id, req.params.id);

  if (existingLike) {
    // Unlike
    db.prepare('DELETE FROM likes WHERE user_id = ? AND recipe_id = ?')
      .run(req.user!.id, req.params.id);
    res.json({ success: true, liked: false });
  } else {
    // Like
    db.prepare('INSERT INTO likes (id, user_id, recipe_id) VALUES (?, ?, ?)')
      .run(uuidv4(), req.user!.id, req.params.id);
    res.json({ success: true, liked: true });
  }
});

// Add comment
router.post('/:id/comments', authenticate, (req: AuthRequest, res) => {
  const { content } = req.body;

  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: '댓글 내용을 입력하세요.' });
  }

  const recipe = db
    .prepare('SELECT id FROM recipes WHERE id = ?')
    .get(req.params.id);

  if (!recipe) {
    return res.status(404).json({ error: '레시피를 찾을 수 없습니다.' });
  }

  const id = uuidv4();
  db.prepare(`
    INSERT INTO comments (id, user_id, recipe_id, content)
    VALUES (?, ?, ?, ?)
  `).run(id, req.user!.id, req.params.id, content.trim());

  res.status(201).json({
    success: true,
    data: { id },
  });
});

export default router;
