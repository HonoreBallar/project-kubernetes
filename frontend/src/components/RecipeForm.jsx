import { useState } from "react";

// État initial du formulaire de création ; utile pour réinitialiser proprement.
const emptyForm = {
  title: "",
  description: "",
  ingredients: "",
  instructions: ""
};

export default function RecipeForm({ onSubmit, message, error }) {
  const [createForm, setCreateForm] = useState(emptyForm);
  const [createImage, setCreateImage] = useState(null);

  // Rend le composant contrôlé : chaque saisie met à jour l'état associé.
  const handleCreateChange = (event) => {
    const { name, value } = event.target;
    setCreateForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Conversion générique vers FormData pour conserver l'upload de fichiers.
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

    await onSubmit(toFormData(createForm, createImage));

    // Réinitialiser le formulaire en cas de succès
    if (!error) {
      setCreateForm(emptyForm);
      setCreateImage(null);
    }
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow">
      <h2 className="mb-4 text-xl font-semibold">Créer une recette</h2>
      <form className="space-y-4" onSubmit={handleSubmit}>
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
      {message && <p className="mt-4 text-sm text-emerald-600">{message}</p>}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </div>
  );
}
