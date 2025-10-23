import { useEffect, useState } from "react";

// Gabarit vide pour réinitialiser les champs lorsque aucune recette n'est choisie.
const emptyForm = {
  title: "",
  description: "",
  ingredients: "",
  instructions: ""
};

export default function RecipeUpdate({
  recipes,
  selectedId,
  onSelectRecipe,
  onUpdateRecipe,
  onDeleteRecipe,
  message,
  error
}) {
  const [updateForm, setUpdateForm] = useState(emptyForm);
  const [updateImage, setUpdateImage] = useState(null);

  // Repère la recette active à partir de la liste complète reçue en props.
  const selectedRecipe = recipes.find(
    (recipe) => String(recipe.id) === String(selectedId)
  );

  useEffect(() => {
    // Quand la sélection change, on pré-remplit le formulaire avec les valeurs.
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

  const handleUpdateChange = (event) => {
    const { name, value } = event.target;
    setUpdateForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedId) {
      return;
    }

    // Recycle le helper `FormData` pour rester cohérent avec la création.
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

    await onUpdateRecipe(selectedId, toFormData(updateForm, updateImage));

    // Réinitialiser l'image en cas de succès
    if (!error) {
      setUpdateImage(null);
    }
  };

  const handleDelete = () => {
    if (selectedId) {
      onDeleteRecipe(selectedId);
    }
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow">
      <h2 className="mb-4 text-xl font-semibold">Modifier une recette</h2>
      <select
        className="mb-4 w-full rounded border border-slate-300 px-3 py-2"
        value={selectedId}
        onChange={(event) => onSelectRecipe(event.target.value)}
      >
        <option value="">Sélectionner…</option>
        {recipes.map((recipe) => (
          <option key={recipe.id} value={String(recipe.id)}>
            {recipe.title}
          </option>
        ))}
      </select>

      <form className="space-y-4" onSubmit={handleSubmit}>
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
            onClick={handleDelete}
            className="flex-1 rounded border border-red-500 px-4 py-2 font-medium text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-300"
          >
            Supprimer
          </button>
        </div>
      </form>
      {message && <p className="mt-4 text-sm text-emerald-600">{message}</p>}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </div>
  );
}
