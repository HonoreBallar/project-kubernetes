const RecipeItem = ({ recipe, onSelect, onDelete, isSelected }) => {
  const cardClasses = [
    "group relative flex h-full transform flex-col rounded-lg border bg-white p-4 shadow-sm transition-transform duration-200",
    isSelected
      ? "border-slate-900 shadow-md ring-2 ring-slate-900/20"
      : "border-slate-200 hover:-translate-y-1 hover:shadow-lg hover:border-slate-300"
  ].join(" ");

  return (
    <li className={cardClasses}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{recipe.title}</h3>
          <p className="text-sm text-slate-600">{recipe.description}</p>
        </div>
        <button
          className="rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-600 transition group-hover:border-slate-400 group-hover:bg-slate-100"
          onClick={() => onSelect(recipe.id)}
        >
          Modifier
        </button>
      </div>
      {recipe.image_url && (
        <img
          alt={recipe.title}
          src={recipe.image_url}
          className="mt-3 max-h-40 w-full rounded object-cover"
          loading="lazy"
        />
      )}
      <div className="mt-3">
        <h4 className="text-sm font-semibold">Ingrédients</h4>
        <p className="text-sm text-slate-600 whitespace-pre-line">
          {recipe.ingredients}
        </p>
      </div>
      <div className="mt-3">
        <h4 className="text-sm font-semibold">Instructions</h4>
        <p className="text-sm text-slate-600 whitespace-pre-line">
          {recipe.instructions}
        </p>
      </div>
      {onDelete && (
        <div className="mt-4 flex justify-end">
          <button
            className="rounded border border-red-200 px-3 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50"
            onClick={() => onDelete(recipe.id)}
          >
            Supprimer
          </button>
        </div>
      )}
    </li>
  );
};

export default function RecipeList({ 
  recipes, 
  loading, 
  onSelectRecipe, 
  onDeleteRecipe,
  selectedId,
  onAddClick
}) {
  if (loading) {
    return <p className="text-sm text-slate-600">Chargement…</p>;
  }

  if (recipes.length === 0) {
    return (
      <div className="rounded-xl bg-white p-6 shadow">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recettes</h2>
          <button
            className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
            onClick={onAddClick}
          >
            Ajouter
          </button>
        </div>
        <p className="text-sm text-slate-600">Aucune recette enregistrée.</p>
      </div>
    );
  }

  return (
    <section className="rounded-xl bg-white p-6 shadow">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Recettes</h2>
        <button
          className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          onClick={onAddClick}
        >
          Ajouter
        </button>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {recipes.map((recipe) => (
          <RecipeItem
            key={recipe.id}
            recipe={recipe}
            onSelect={onSelectRecipe}
            onDelete={onDeleteRecipe}
            isSelected={String(recipe.id) === selectedId}
          />
        ))}
      </ul>
    </section>
  );
}
