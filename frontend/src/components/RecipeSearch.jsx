import { useState } from "react";

// Barre de recherche autonome qui délègue la requête au parent (App).
export default function RecipeSearch({ onSearch, searchResults, error }) {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!searchTerm.trim()) {
      return;
    }
    await onSearch(searchTerm);
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow">
      <h2 className="mb-4 text-xl font-semibold">Rechercher une recette</h2>
      <form className="flex flex-col gap-4 md:flex-row" onSubmit={handleSubmit}>
        <input
          className="flex-1 rounded border border-slate-300 px-3 py-2"
          placeholder="Mot-clé"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
        <button
          type="submit"
          className="rounded bg-slate-900 px-4 py-2 font-medium text-white transition hover:bg-slate-700"
        >
          Chercher
        </button>
      </form>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {searchResults.length > 0 && (
        <ul className="mt-4 space-y-3">
          {searchResults.map((recipe) => (
            <li key={recipe.id} className="rounded border border-slate-200 p-4">
              <h3 className="font-semibold">{recipe.title}</h3>
              <p className="text-sm text-slate-600">{recipe.description}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
