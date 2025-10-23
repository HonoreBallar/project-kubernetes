import { useEffect, useState } from "react";
import RecipeList from "./components/RecipeList";
import RecipeForm from "./components/RecipeForm";
import RecipeUpdate from "./components/RecipeUpdate";

// Origine des appels API :
// - `VITE_API_URL` pointe vers le backend (utile en dev via proxy ou en prod).
// - `BACKEND_ORIGIN` permet de reconstituer un lien absolu pour les images.
const API_URL = import.meta.env.VITE_API_URL ?? "/api";
const BACKEND_ORIGIN = (import.meta.env.VITE_BACKEND_ORIGIN ?? "").replace(/\/$/, "");

// Reconstruit une URL d'image exploitable quel que soit l'endroit où l'app tourne.
const resolveImageUrl = (imageUrl) => {
  if (!imageUrl) {
    return imageUrl;
  }
  if (/^https?:\/\//i.test(imageUrl)) {
    return imageUrl;
  }
  const normalized = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;
  if (BACKEND_ORIGIN) {
    return `${BACKEND_ORIGIN}${normalized}`;
  }
  return normalized;
};

// Enrichit la recette reçue avec une URL d'image normalisée.
const withResolvedImage = (recipe) => {
  if (!recipe?.image_url) {
    return recipe;
  }
  return {
    ...recipe,
    image_url: resolveImageUrl(recipe.image_url)
  };
};

export default function App() {
  // `recipes` contient la liste principale affichée dans la vue "list".
  const [recipes, setRecipes] = useState([]);
  // `loading` permet d'afficher un feedback visuel pendant les appels réseau.
  const [loading, setLoading] = useState(false);
  // `error` et `message` sont partagés entre les vues pour informer l'utilisateur.
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  // `selectedId` sert à pointer la recette en cours d'édition/suppression.
  const [selectedId, setSelectedId] = useState("");
  // `searchResults` stocke le résultat brut pour la fonctionnalité de recherche.
  const [searchResults, setSearchResults] = useState([]);
  // `activeView` pilote la navigation interne (liste, création, mise à jour).
  const [activeView, setActiveView] = useState("list");

  // Récupère toutes les recettes depuis l'API et gère erreurs/chargement.
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
    // On déclenche le chargement initial à l'affichage du composant.
    fetchRecipes().catch(() => null);
  }, []);

  // Vue d'ajout : on reset les états d'erreur et sélection.
  const showCreateView = () => {
    setMessage("");
    setError("");
    setSelectedId("");
    setActiveView("create");
  };

  // Retour à la liste depuis une sous-vue.
  const handleBackToList = () => {
    setSelectedId("");
    setActiveView("list");
  };

  // Lorsqu'on clique "Modifier" sur une carte, on bascule en mode édition.
  const showUpdateView = (recipeId) => {
    setMessage("");
    setError("");
    setSelectedId(recipeId ? String(recipeId) : "");
    setActiveView("update");
  };

  // Envoie le formulaire de création au backend (multipart).
  const handleCreateRecipe = async (formData) => {
    setMessage("");
    setError("");
    try {
      const response = await fetch(`${API_URL}/recipes`, {
        method: "POST",
        body: formData
      });
      if (!response.ok) {
        const detail = await response.json().catch(() => ({}));
        throw new Error(detail.detail ?? "Création impossible");
      }
      const result = await response.json();
      setMessage(`Recette créée avec succès`);
      setActiveView("list");
      await fetchRecipes();
    } catch (err) {
      setError(err.message ?? "Création impossible");
    }
  };

  // Gère l'édition d'une recette et rafraîchit la liste après succès.
  const handleUpdateRecipe = async (recipeId, formData) => {
    setMessage("");
    setError("");
    try {
      const response = await fetch(`${API_URL}/recipes/${recipeId}`, {
        method: "PUT",
        body: formData
      });
      if (!response.ok) {
        const detail = await response.json().catch(() => ({}));
        throw new Error(detail.detail ?? "Mise à jour impossible");
      }
      const updated = await response.json();
      setMessage(`Recette mise à jour (${updated.title})`);
      setActiveView("list");
      setSelectedId("");
      await fetchRecipes();
    } catch (err) {
      setError(err.message ?? "Mise à jour impossible");
    }
  };

  // Confirme la suppression avec l'utilisateur avant d'appeler l'API.
  const handleDeleteRecipe = async (recipeId) => {
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
      if (String(recipeId) === selectedId) {
        setSelectedId("");
        setActiveView("list");
      }
      await fetchRecipes();
    } catch (err) {
      setError(err.message ?? "Suppression impossible");
    }
  };

  // Déclenche la recherche full-text du backend et stocke les résultats.
  const handleSearch = async (searchTerm) => {
    setError("");
    setSearchResults([]);
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
            Autor : <code>Amounan Honoré</code>
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        {activeView === "list" && message && (
          <p className="rounded border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
            {message}
          </p>
        )}
        {activeView === "list" && error && (
          <p className="rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {activeView === "create" ? (
          // Vue de création affichée quand `activeView` vaut "create".
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Nouvelle recette</h2>
              <button
                className="rounded border border-slate-300 px-3 py-1 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                onClick={handleBackToList}
              >
                Retour à la liste
              </button>
            </div>
            <RecipeForm onSubmit={handleCreateRecipe} message={message} error={error} />
          </section>
        ) : activeView === "update" ? (
          // Vue de mise à jour lorsqu'une recette est sélectionnée.
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Modifier une recette</h2>
              <button
                className="rounded border border-slate-300 px-3 py-1 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                onClick={handleBackToList}
              >
                Retour à la liste
              </button>
            </div>
            <RecipeUpdate
              recipes={recipes}
              selectedId={selectedId}
              onSelectRecipe={(value) => setSelectedId(value ? String(value) : "")}
              onUpdateRecipe={handleUpdateRecipe}
              onDeleteRecipe={handleDeleteRecipe}
              message={message}
              error={error}
            />
          </section>
        ) : (
          // Vue par défaut : liste des recettes existantes.
          <RecipeList
            recipes={recipes}
            loading={loading}
            onSelectRecipe={showUpdateView}
            onDeleteRecipe={handleDeleteRecipe}
            selectedId={selectedId}
            onAddClick={showCreateView}
          />
        )}
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
