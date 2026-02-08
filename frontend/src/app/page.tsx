import { RecipeList } from '@/components/recipe/recipe-list';

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          맛있는 레시피를 공유하세요
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          전세계의 다양한 레시피를 발견하고, 나만의 레시피를 공유해보세요.
        </p>
      </section>

      <RecipeList />
    </div>
  );
}
