import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Loader2, 
  Upload, 
  X, 
  Eraser,
  Shield,
  Info,
  ClipboardCheck,
  Camera,
  FileSignature,
  MessageSquare,
  ChevronDown,
  ChevronUp
} from "lucide-react";

// --- CONFIGURATION DES ÉTAPES ---
const STEPS = [
  { id: 1, title: "Infos générales", icon: Info },
  { id: 2, title: "Points de contrôle", icon: ClipboardCheck },
  { id: 3, title: "Photos et Signatures", icon: Camera },
];

// --- CONFIGURATION DE LA CHECKLIST ---
const CHECKLIST_CATEGORIES = [
  {
    name: "Affichages, Présentation et Tenue",
    items: [
      { key: "affichages_legaux_presents", label: "Affichages légaux présents" },
      { key: "affichages_legaux_visible", label: "Affichages légaux visible" },
      { key: "kakemono", label: "Kakémono" },
      { key: "positionnement_balance", label: "Positionnement balance" },
      { key: "bulle_centree_balance", label: "Bulle centrée balance" },
      { key: "port_du_badge", label: "Port du badge" },
      { key: "cours_a_jour", label: "Cours à jour" },
      { key: "source_du_cours", label: "Source du cours" },
      { key: "date_du_cours", label: "Date du cours" },
      { key: "affichage_flyer", label: "Affichage flyer" },
      { key: "etiquettes_date_flacons_acide", label: "Étiquettes date flacons acide" },
      { key: "date_revision_balance", label: "Date de révision balance" },
      { key: "tenue", label: "Tenue" },
    ]
  },
  {
    name: "Administratif",
    items: [
      { key: "conformites_a_jour", label: "Conformités à jour" },
      { key: "ldp_a_jour", label: "LDP à jour" },
      { key: "date_sortie_a_jour", label: "Date de sortie à jour" },
      { key: "designation_correcte_ldp", label: "Désignation correcte LDP" },
      { key: "indicatif_g_present_ldp", label: "Indicatif g présent LDP" },
      { key: "remplissage_ldp_procedure", label: "Remplissage LDP selon procédure" },
      { key: "rom_a_jour", label: "ROM à jour" },
      { key: "remplissage_rom_procedure", label: "Remplissage ROM selon procédure" },
      { key: "book_acheteur_a_jour", label: "Book acheteur à jour" },
      { key: "envoi_photo_groupe_deloc", label: "Envoi photo groupe déloc" },
    ]
  },
  {
    name: "Achats",
    items: [
      { key: "exactitude_facture", label: "Exactitude de la facture" },
      { key: "conditionnements_bijoux", label: "Conditionnements bijoux" },
      { key: "scotch_facture_cheque", label: "Scotch sur facture / chèque" },
      { key: "exactitude_designations", label: "Exactitude des désignations" },
      { key: "respect_titrages", label: "Respect des titrages" },
      { key: "erreur_or", label: "Erreur or?" },
      { key: "erreur_agt", label: "Erreur agt?" },
      { key: "erreur_po", label: "Erreur PO?" },
      { key: "erreur_ma", label: "Erreur MA?" },
      { key: "ecart_poids_facture_reel", label: "Écart poids facture / réel" },
      { key: "bijoux_non_poinconnes_coupes_48h", label: "Bijoux non poinçonnés coupés après 48h" },
      { key: "facturier_secours", label: "Facturier de secours" },
      { key: "verification_etat_valise", label: "Vérification état valise" },
    ]
  }
];

const createInitialChecklist = () => {
  const checklist = {};
  CHECKLIST_CATEGORIES.forEach(category => {
    category.items.forEach(item => {
      checklist[item.key] = { status: "NON CONFORME", comment: "" };
    });
  });
  return checklist;
};

export default function AuditFormPage() {
  const { user, api } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // États pour les listes dynamiques
  const [commercials, setCommercials] = useState([]);
  const [controllers, setControllers] = useState([]);
  
  const [expandedCategories, setExpandedCategories] = useState({
    "Affichages, Présentation et Tenue": true,
    "Administratif": true,
    "Achats": true
  });
  
  const signatureCommercialRef = useRef(null);
  const signatureControleurRef = useRef(null);

  const [formData, setFormData] = useState({
    date_controle: new Date().toISOString().split("T")[0],
    heure: new Date().toTimeString().slice(0, 5),
    lieu: "",
    commercial_controle: "",
    controleur_interne: "", // Sera rempli par le Select
    checklist: createInitialChecklist(),
    photo_livre_police: null,
    photo_erreur_1: null,
    photo_erreur_2: null,
    observations: "",
    actions_correctives: "",
    resultat_global: "NON CONFORME",
    signature_commercial: null,
    signature_controleur: null,
  });

  // Chargement des listes au montage du composant
  useEffect(() => {
    const loadListData = async () => {
      try {
        const [commRes, contRes] = await Promise.all([
          api.get("/users/commercials"),
          api.get("/users/controllers")
        ]);
        setCommercials(commRes.data);
        setControllers(contRes.data);
      } catch (err) {
        toast.error("Erreur lors du chargement des listes (Commerciaux/Contrôleurs)");
      }
    };
    loadListData();
  }, [api]);

  useEffect(() => {
    const allConforme = Object.values(formData.checklist).every(
      (item) => item.status === "CONFORME"
    );
    setFormData((prev) => ({
      ...prev,
      resultat_global: allConforme ? "CONFORME" : "NON CONFORME",
    }));
  }, [formData.checklist]);

  // --- HANDLERS ---
  const handleChecklistStatusChange = (key, status) => {
    setFormData((prev) => ({
      ...prev,
      checklist: { ...prev.checklist, [key]: { ...prev.checklist[key], status } },
    }));
  };

  const handleChecklistCommentChange = (key, comment) => {
    setFormData((prev) => ({
      ...prev,
      checklist: { ...prev.checklist, [key]: { ...prev.checklist[key], comment } },
    }));
  };

  const toggleCategory = (categoryName) => {
    setExpandedCategories(prev => ({ ...prev, [categoryName]: !prev[categoryName] }));
  };

  const handleImageUpload = (key) => (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { toast.error("L'image ne doit pas dépasser 5 Mo"); return; }
      const reader = new FileReader();
      reader.onloadend = () => setFormData((prev) => ({ ...prev, [key]: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = (key) => setFormData((prev) => ({ ...prev, [key]: null }));

  const clearSignature = (ref) => ref.current?.clear();

  const saveSignature = (ref, key) => {
    if (ref.current && !ref.current.isEmpty()) {
      setFormData((prev) => ({ ...prev, [key]: ref.current.toDataURL() }));
      toast.success("Signature enregistrée");
    } else {
      toast.error("Veuillez signer avant d'enregistrer");
    }
  };

  const handleSubmit = async () => {
    if (!formData.signature_commercial || !formData.signature_controleur) {
      toast.error("Les deux signatures sont obligatoires");
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post("/audits", formData);
      toast.success("Audit enregistré !");
      navigate("/");
    } catch (err) {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- RENDERS ---
  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {STEPS.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div className={`step-indicator ${currentStep === step.id ? "active" : currentStep > step.id ? "completed" : "pending"}`}>
            {currentStep > step.id ? <Check className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
          </div>
          {index < STEPS.length - 1 && <div className={`step-connector mx-2 w-16 sm:w-24 ${currentStep > step.id ? "completed" : ""}`} />}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6 animate-fade-in-up">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-zinc-300">Date du contrôle *</Label>
          <Input type="date" value={formData.date_controle} onChange={(e) => setFormData({ ...formData, date_controle: e.target.value })} className="bg-zinc-950 border-zinc-800 h-12" />
        </div>
        <div className="space-y-2">
          <Label className="text-zinc-300">Heure *</Label>
          <Input type="time" value={formData.heure} onChange={(e) => setFormData({ ...formData, heure: e.target.value })} className="bg-zinc-950 border-zinc-800 h-12" />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-zinc-300">Lieu *</Label>
        <Input placeholder="Ex: Agence Paris Centre" value={formData.lieu} onChange={(e) => setFormData({ ...formData, lieu: e.target.value })} className="bg-zinc-950 border-zinc-800 h-12" />
      </div>

      <div className="space-y-2">
        <Label className="text-zinc-300">Commercial contrôlé *</Label>
        <Select value={formData.commercial_controle} onValueChange={(v) => setFormData({ ...formData, commercial_controle: v })}>
          <SelectTrigger className="bg-zinc-950 border-zinc-800 h-12">
            <SelectValue placeholder="Sélectionner un commercial" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800 max-h-60">
            {commercials.map((c) => (
              <SelectItem key={c.id} value={c.name} className="hover:bg-zinc-800">
                <div className="flex justify-between w-full gap-4">
                  <span>{c.name}</span>
                  <span className={`text-[10px] px-1.5 rounded ${c.team === 'Ben' ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                    {c.team}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-zinc-300">Contrôleur interne *</Label>
        <Select value={formData.controleur_interne} onValueChange={(v) => setFormData({ ...formData, controleur_interne: v })}>
          <SelectTrigger className="bg-zinc-950 border-zinc-800 h-12">
            <SelectValue placeholder="Choisir le contrôleur" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800">
            {controllers.map((name) => (
              <SelectItem key={name} value={name}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6 animate-fade-in-up">
      {CHECKLIST_CATEGORIES.map((category) => (
        <div key={category.name} className="border border-zinc-800 rounded-xl overflow-hidden">
          <button type="button" onClick={() => toggleCategory(category.name)} className="w-full flex items-center justify-between p-4 bg-zinc-900 hover:bg-zinc-800/80 transition-colors">
            <h3 className="text-white font-semibold">{category.name}</h3>
            {expandedCategories[category.name] ? <ChevronUp className="w-5 h-5 text-zinc-400" /> : <ChevronDown className="w-5 h-5 text-zinc-400" />}
          </button>
          
          {expandedCategories[category.name] && (
            <div className="divide-y divide-zinc-800 bg-zinc-900/50">
              {category.items.map((item) => (
                <div key={item.key} className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <span className="text-white text-sm">{item.label}</span>
                    <div className="flex gap-2">
                      <Button type="button" onClick={() => handleChecklistStatusChange(item.key, "CONFORME")} className={`px-3 py-1 rounded-lg text-xs font-bold ${formData.checklist[item.key]?.status === "CONFORME" ? "bg-emerald-500 text-white" : "bg-zinc-800 text-zinc-500"}`}>CONFORME</Button>
                      <Button type="button" onClick={() => handleChecklistStatusChange(item.key, "NON CONFORME")} className={`px-3 py-1 rounded-lg text-xs font-bold ${formData.checklist[item.key]?.status === "NON CONFORME" ? "bg-red-500 text-white" : "bg-zinc-800 text-zinc-500"}`}>NON CONFORME</Button>
                    </div>
                  </div>
                  <Input placeholder="Note éventuelle..." value={formData.checklist[item.key]?.comment || ""} onChange={(e) => handleChecklistCommentChange(item.key, e.target.value)} className="bg-zinc-950 border-zinc-800 h-8 text-xs" />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-8 animate-fade-in-up">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[{ k: "photo_livre_police", l: "Livre de Police" }, { k: "photo_erreur_1", l: "Erreur 1" }, { k: "photo_erreur_2", l: "Erreur 2" }].map((p) => (
          <div key={p.k} className="space-y-2">
            <Label className="text-zinc-400 text-xs">{p.l}</Label>
            {formData[p.k] ? (
              <div className="relative h-32 rounded-lg border border-zinc-800 overflow-hidden">
                <img src={formData[p.k]} className="w-full h-full object-cover" />
                <Button variant="ghost" size="icon" onClick={() => handleRemoveImage(p.k)} className="absolute top-1 right-1 bg-red-500 h-6 w-6"><X className="h-3 w-3" /></Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-zinc-800 rounded-lg cursor-pointer hover:bg-zinc-900">
                <Camera className="w-6 h-6 text-zinc-600" />
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload(p.k)} />
              </label>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-zinc-400">Signature Commercial</Label>
          <div className="bg-white rounded-lg"><SignatureCanvas ref={signatureCommercialRef} canvasProps={{ className: "w-full h-32" }} penColor="black" /></div>
          <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => clearSignature(signatureCommercialRef)} className="flex-1">Effacer</Button><Button size="sm" onClick={() => saveSignature(signatureCommercialRef, "signature_commercial")} className="flex-1 btn-gold">Valider</Button></div>
        </div>
        <div className="space-y-2">
          <Label className="text-zinc-400">Signature Contrôleur</Label>
          <div className="bg-white rounded-lg"><SignatureCanvas ref={signatureControleurRef} canvasProps={{ className: "w-full h-32" }} penColor="black" /></div>
          <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => clearSignature(signatureControleurRef)} className="flex-1">Effacer</Button><Button size="sm" onClick={() => saveSignature(signatureControleurRef, "signature_controleur")} className="flex-1 btn-gold">Valider</Button></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen rafy-bg pb-20">
      <header className="glass sticky top-0 z-50 border-b border-zinc-800 h-16 flex items-center px-4">
        <Button variant="ghost" onClick={() => navigate("/")} className="text-zinc-400"><ArrowLeft className="mr-2 h-4 w-4" />Retour</Button>
      </header>

      <main className="max-w-4xl mx-auto p-4 sm:p-8">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-[#FFD700]" style={{ fontFamily: "'Playfair Display', serif" }}>Contrôle Interne</CardTitle>
            {renderStepIndicator()}
          </CardHeader>
          
          <CardContent>
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}

            <div className="flex justify-between mt-10 pt-6 border-t border-zinc-800">
              <Button variant="outline" onClick={() => setCurrentStep(s => Math.max(1, s-1))} disabled={currentStep === 1}>Précédent</Button>
              {currentStep < 3 ? (
                <Button onClick={() => setCurrentStep(s => Math.min(3, s+1))} className="btn-gold">Suivant</Button>
              ) : (
                <Button onClick={handleSubmit} disabled={isSubmitting} className="btn-gold">
                  {isSubmitting ? <Loader2 className="animate-spin" /> : "Enregistrer l'Audit"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}