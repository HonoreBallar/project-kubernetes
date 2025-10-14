import { useEffect, useMemo, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL ?? "/api";
const BACKEND_ORIGIN = import.meta.env.VITE_BACKEND_ORIGIN ?? "http://localhost:8000";

const withResolvedImage = (recipe) => {
  if (!recipe?.image_url) {
    return recipe;
  }
  if (/^https?:\/\//i.test(recipe.image_url)) {
    return recipe;
  }
  return {
    ...recipe,
    image_url: `${BACKEND_ORIGIN}${recipe.image_url}`
  };
};

const emptyForm = {
  title: "",
  description: "",
  ingredients: "",
  instructions: ""
};

export default function App() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [createForm, setCreateForm] = useState(emptyForm);
  const [createImage, setCreateImage] = useState(null);

  const [selectedId, setSelectedId] = useState("");
  const [updateForm, setUpdateForm] = useState(emptyForm);
  const [updateImage, setUpdateImage] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const selectedRecipe = useMemo(
    () => recipes.find((recipe) => recipe.id === selectedId),
    [recipes, selectedId]
  );

  useEffect(() => {
    if (selectedRecipe) {
      setUpdateForm({
        title: selectedRecipe.title ?? "",
        description: selectedRecipe.description ?? "",
        ingredients: selectedRecipe.ingredients ?? "",
        instructions: selectedRecipe.instructions ?? ""
      });
    } else {
      setUpdateForm(emptyForm);
      setUpdateImage(null);
    }
  }, [selectedRecipe]);

  const fetchRecipes = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/recipes`);
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }
      const data = await response.json();
      setRecipes(data.map(withResolvedImage));
    } catch (err) {
      setError(err.message ?? "Impossible de récupérer les recettes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes().catch(() => null);
  }, []);

  const handleCreateChange = (event) => {
    const { name, value } = event.target;
    setCreateForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateChange = (event) => {
    const { name, value } = event.target;
    setUpdateForm((prev) => ({ ...prev, [name]: value }));
  };

  const toFormData = (form, imageFile) => {
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        formData.append(key, value);
      }
    });
    if (imageFile) {
      formData.append("image", imageFile);
    }
    return formData;
  };

  const handleCreateSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      const response = await fetch(`${API_URL}/recipes`, {
        method: "POST",
        body: toFormData(createForm, createImage)
      });
      if (!response.ok) {
        const detail = await response.json().catch(() => ({}));
        throw new Error(detail.detail ?? "Création impossible");
      }
      const result = await response.json();
      setMessage(`Recette créée (id: ${result.id})`);
      setCreateForm(emptyForm);
      setCreateImage(null);
      await fetchRecipes();
    } catch (err) {
      setError(err.message ?? "Création impossible");
    }
  };

  const handleUpdateSubmit = async (event) => {
    event.preventDefault();
    if (!selectedId) {
      setError("Sélectionnez une recette à modifier");
      return;
    }
    setMessage("");
    setError("");
    try {
      const response = await fetch(`${API_URL}/recipes/${selectedId}`, {
        method: "PUT",
        body: toFormData(updateForm, updateImage)
      });
      if (!response.ok) {
        const detail = await response.json().catch(() => ({}));
        throw new Error(detail.detail ?? "Mise à jour impossible");
      }
      const updated = await response.json();
      setMessage(`Recette mise à jour (${updated.title})`);
      setUpdateImage(null);
      await fetchRecipes();
    } catch (err) {
      setError(err.message ?? "Mise à jour impossible");
    }
  };

  const handleDelete = async (recipeId) => {
    const shouldDelete = window.confirm("Supprimer cette recette ?");
    if (!shouldDelete) {
      return;
    }
    setMessage("");
    setError("");
    try {
      const response = await fetch(`${API_URL}/recipes/${recipeId}`, {
        method: "DELETE"
      });
      if (!response.ok) {
        const detail = await response.json().catch(() => ({}));
        throw new Error(detail.detail ?? "Suppression impossible");
      }
      setMessage("Recette supprimée");
      if (recipeId === selectedId) {
        setSelectedId("");
      }
      await fetchRecipes();
    } catch (err) {
      setError(err.message ?? "Suppression impossible");
    }
  };

  const handleSearch = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setSearchResults([]);
    if (!searchTerm.trim()) {
      return;
    }
    try {
      const response = await fetch(
        `${API_URL}/recipes/search?query=${encodeURIComponent(searchTerm)}`
      );
      if (!response.ok) {
        throw new Error(`Recherche impossible (${response.status})`);
      }
      const results = await response.json();
      setSearchResults(results.map(withResolvedImage));
    } catch (err) {
      setError(err.message ?? "Recherche impossible");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="bg-slate-900 text-white py-6 shadow">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 md:flex-row md:items-center md:justify-between">
          <h1 className="text-3xl font-semibold">Gestion des Recettes</h1>
          <span className="text-slate-300">
            API: <code>{API_URL}</code>
          </span>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-3">
        <section className="lg:col-span-2 space-y-6">
          <div className="rounded-xl bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">Créer une recette</h2>
            <form className="space-y-4" onSubmit={handleCreateSubmit}>
              <input
                className="w-full rounded border border-slate-300 px-3 py-2"
                name="title"
                placeholder="Titre"
                value={createForm.title}
                onChange={handleCreateChange}
                required
              />
              <textarea
                className="w-full rounded border border-slate-300 px-3 py-2"
                name="description"
                placeholder="Description"
                rows={3}
                value={createForm.description}
                onChange={handleCreateChange}
                required
              />
              <textarea
                className="w-full rounded border border-slate-300 px-3 py-2"
                name="ingredients"
                placeholder="Ingrédients (séparés par des virgules)"
                rows={3}
                value={createForm.ingredients}
                onChange={handleCreateChange}
                required
              />
              <textarea
                className="w-full rounded border border-slate-300 px-3 py-2"
                name="instructions"
                placeholder="Instructions"
                rows={3}
                value={createForm.instructions}
                onChange={handleCreateChange}
                required
              />
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Image (optionnelle)</span>
                <input
                  className="mt-1 block w-full text-sm text-slate-700 file:mr-4 file:rounded file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-white"
                  type="file"
                  accept="image/*"
                  onChange={(event) => setCreateImage(event.target.files?.[0] ?? null)}
                />
              </label>
              <button
                type="submit"
                className="w-full rounded bg-slate-900 px-4 py-2 font-medium text-white transition hover:bg-slate-700"
              >
                Enregistrer
              </button>
            </form>
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">Rechercher une recette</h2>
            <form className="flex flex-col gap-4 md:flex-row" onSubmit={handleSearch}>
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
        </section>

        <aside className="space-y-6">
          <div className="rounded-xl bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">Modifier une recette</h2>
            <select
              className="mb-4 w-full rounded border border-slate-300 px-3 py-2"
              value={selectedId}
              onChange={(event) => setSelectedId(event.target.value)}
            >
              <option value="">Sélectionner…</option>
              {recipes.map((recipe) => (
                <option key={recipe.id} value={recipe.id}>
                  {recipe.title}
                </option>
              ))}
            </select>

            <form className="space-y-4" onSubmit={handleUpdateSubmit}>
              <input
                className="w-full rounded border border-slate-300 px-3 py-2"
                name="title"
                placeholder="Titre"
                value={updateForm.title}
                onChange={handleUpdateChange}
              />
              <textarea
                className="w-full rounded border border-slate-300 px-3 py-2"
                name="description"
                placeholder="Description"
                rows={2}
                value={updateForm.description}
                onChange={handleUpdateChange}
              />
              <textarea
                className="w-full rounded border border-slate-300 px-3 py-2"
                name="ingredients"
                placeholder="Ingrédients"
                rows={2}
                value={updateForm.ingredients}
                onChange={handleUpdateChange}
              />
              <textarea
                className="w-full rounded border border-slate-300 px-3 py-2"
                name="instructions"
                placeholder="Instructions"
                rows={2}
                value={updateForm.instructions}
                onChange={handleUpdateChange}
              />
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Nouvelle image (optionnelle)</span>
                <input
                  className="mt-1 block w-full text-sm text-slate-700 file:mr-4 file:rounded file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-white"
                  type="file"
                  accept="image/*"
                  onChange={(event) => setUpdateImage(event.target.files?.[0] ?? null)}
                  disabled={!selectedId}
                />
              </label>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={!selectedId}
                  className="flex-1 rounded bg-slate-900 px-4 py-2 font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  Mettre à jour
                </button>
                <button
                  type="button"
                  disabled={!selectedId}
                  onClick={() => selectedId && handleDelete(selectedId)}
                  className="flex-1 rounded border border-red-500 px-4 py-2 font-medium text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-300"
                >
                  Supprimer
                </button>
              </div>
            </form>
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">Recettes</h2>
            {loading ? (
              <p className="text-sm text-slate-600">Chargement…</p>
            ) : recipes.length === 0 ? (
              <p className="text-sm text-slate-600">Aucune recette enregistrée.</p>
            ) : (
              <ul className="space-y-4">
                {recipes.map((recipe) => (
                  <li key={recipe.id} className="rounded border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold">{recipe.title}</h3>
                        <p className="text-sm text-slate-600">{recipe.description}</p>
                      </div>
                      <button
                        className="rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                        onClick={() => setSelectedId(recipe.id)}
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
                  </li>
                ))}
              </ul>
            )}
          </div>

          {(error || message) && (
            <div className="rounded-xl bg-white p-4 shadow">
              {error && <p className="text-sm text-red-600">{error}</p>}
              {message && <p className="text-sm text-emerald-600">{message}</p>}
            </div>
          )}
        </aside>
      </main>

      <footer className="border-t border-slate-200 bg-white py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 text-sm text-slate-500">
          <span>Frontend React + Tailwind</span>
          <button
            className="rounded border border-slate-300 px-3 py-1 hover:bg-slate-100"
            onClick={() => fetchRecipes()}
          >
            Rafraîchir
          </button>
        </div>
      </footer>
    </div>
  );
}
