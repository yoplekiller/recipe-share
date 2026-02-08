'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, MessageCircle, Clock, Users } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { recipeApi } from '@/lib/api';

interface Recipe {
  id: string;
  title: string;
  description: string;
  image_url: string;
  cooking_time: number;
  servings: number;
  difficulty: string;
  author_nickname: string;
  like_count: number;
  comment_count: number;
  created_at: string;
}

export function RecipeList() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const { data } = await recipeApi.getAll({ limit: 12 });
        setRecipes(data.data.recipes);
      } catch (error) {
        console.error('Failed to fetch recipes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecipes();
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-48 bg-muted rounded-t-lg" />
            <CardHeader>
              <div className="h-6 bg-muted rounded w-3/4" />
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-muted rounded w-full mb-2" />
              <div className="h-4 bg-muted rounded w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (recipes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">아직 등록된 레시피가 없습니다.</p>
        <p className="text-sm text-muted-foreground mt-2">
          첫 번째 레시피를 등록해보세요!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {recipes.map((recipe) => (
        <Link key={recipe.id} href={`/recipes/${recipe.id}`}>
          <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
            <div className="relative h-48 overflow-hidden rounded-t-lg">
              {recipe.image_url ? (
                <Image
                  src={recipe.image_url}
                  alt={recipe.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="h-full bg-muted flex items-center justify-center">
                  <span className="text-muted-foreground">No Image</span>
                </div>
              )}
            </div>

            <CardHeader>
              <CardTitle className="line-clamp-1">{recipe.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                by {recipe.author_nickname}
              </p>
            </CardHeader>

            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {recipe.description || '설명이 없습니다.'}
              </p>

              <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                {recipe.cooking_time && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {recipe.cooking_time}분
                  </span>
                )}
                {recipe.servings && (
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {recipe.servings}인분
                  </span>
                )}
              </div>
            </CardContent>

            <CardFooter className="text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  {recipe.like_count}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  {recipe.comment_count}
                </span>
              </div>
            </CardFooter>
          </Card>
        </Link>
      ))}
    </div>
  );
}
