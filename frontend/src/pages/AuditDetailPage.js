import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Download, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Shield,
  Check,
  X,
  FileText,
  Image as ImageIcon,
  FileSignature,
  Loader2,
  MessageSquare,
  ChevronDown,
  ChevronUp
} from "lucide-react";

// Checklist items organized by category (same as form)
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

export default function AuditDetailPage() {
  const { id } = useParams();
  const { api } = useAuth();
  const navigate = useNavigate();
  const [audit, setAudit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({
    "Affichages, Présentation et Tenue": true,
    "Administratif": true,
    "Achats": true
  });

  useEffect(() => {
    fetchAudit();
  }, [id]);

  const fetchAudit = async () => {
    try {
      const response = await api.get(`/audits/${id}`);
      setAudit(response.data);
    } catch (err) {
      toast.error("Erreur lors du chargement de l'audit");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const response = await api.get(`/audits/${id}/pdf`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `PV_Audit_${audit.commercial_controle}_${audit.date_controle}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("PDF téléchargé avec succès");
    } catch (err) {
      toast.error("Erreur lors du téléchargement du PDF");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const toggleCategory = (categoryName) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  };

  const getItemData = (key) => {
    if (!audit?.checklist) return { status: "NON CONFORME", comment: "" };
    const item = audit.checklist[key];
    if (typeof item === 'object') {
      return { status: item.status || "NON CONFORME", comment: item.comment || "" };
    }
    return { status: item || "NON CONFORME", comment: "" };
  };

  const getCategoryStats = (category) => {
    const total = category.items.length;
    const conformes = category.items.filter(item => {
      const data = getItemData(item.key);
      return data.status === "CONFORME";
    }).length;
    return { conformes, total };
  };

  if (loading) {
    return (
      <div className="min-h-screen rafy-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!audit) {
    return null;
  }

  return (
    <div className="min-h-screen rafy-bg">
      {/* Header */}
      <header className="glass sticky top-0 z-50 border-b border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="text-zinc-400 hover:text-white -ml-2"
              data-testid="back-btn"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Retour
            </Button>
            <Button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="btn-gold"
              data-testid="download-pdf-btn"
            >
              {downloadingPdf ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Title Card */}
        <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
          <div className={`h-2 ${audit.resultat_global === "CONFORME" ? "bg-emerald-500" : "bg-red-500"}`} />
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#FFD700] flex items-center justify-center">
                  <Shield className="w-7 h-7 text-black" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                    PV de Contrôle
                  </CardTitle>
                  <p className="text-zinc-400 mt-1">{audit.commercial_controle}</p>
                </div>
              </div>
              <span
                className={`px-4 py-2 rounded-full text-sm font-bold ${
                  audit.resultat_global === "CONFORME"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-red-500/20 text-red-400"
                }`}
                data-testid="audit-result-badge"
              >
                {audit.resultat_global}
              </span>
            </div>
          </CardHeader>
        </Card>

        {/* Info Section */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="border-b border-zinc-800">
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#FFD700]" />
              Informations générales
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-[#FFD700]" />
                </div>
                <div>
                  <p className="text-zinc-500 text-sm">Date</p>
                  <p className="text-white">{audit.date_controle}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-[#FFD700]" />
                </div>
                <div>
                  <p className="text-zinc-500 text-sm">Heure</p>
                  <p className="text-white">{audit.heure}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-[#FFD700]" />
                </div>
                <div>
                  <p className="text-zinc-500 text-sm">Lieu</p>
                  <p className="text-white">{audit.lieu}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                  <User className="w-5 h-5 text-[#FFD700]" />
                </div>
                <div>
                  <p className="text-zinc-500 text-sm">Contrôleur</p>
                  <p className="text-white">{audit.controleur_interne}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Checklist Section by Categories */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="border-b border-zinc-800">
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Check className="w-5 h-5 text-[#FFD700]" />
              Points de contrôle
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {CHECKLIST_CATEGORIES.map((category) => {
              const stats = getCategoryStats(category);
              const isExpanded = expandedCategories[category.name];
              
              return (
                <div key={category.name} className="border border-zinc-800 rounded-xl overflow-hidden">
                  {/* Category Header */}
                  <button
                    type="button"
                    onClick={() => toggleCategory(category.name)}
                    className="w-full flex items-center justify-between p-4 bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <h3 className="text-white font-semibold text-left">{category.name}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        stats.conformes === stats.total 
                          ? "bg-emerald-500/20 text-emerald-400" 
                          : "bg-zinc-700 text-zinc-300"
                      }`}>
                        {stats.conformes}/{stats.total}
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-zinc-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-zinc-400" />
                    )}
                  </button>
                  
                  {/* Category Items */}
                  {isExpanded && (
                    <div className="divide-y divide-zinc-800">
                      {category.items.map((item) => {
                        const data = getItemData(item.key);
                        return (
                          <div
                            key={item.key}
                            className="p-4 bg-zinc-900/50"
                            data-testid={`checklist-detail-${item.key}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-white">{item.label}</span>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                                  data.status === "CONFORME"
                                    ? "bg-emerald-500/20 text-emerald-400"
                                    : "bg-red-500/20 text-red-400"
                                }`}
                              >
                                {data.status === "CONFORME" ? (
                                  <Check className="w-3 h-3" />
                                ) : (
                                  <X className="w-3 h-3" />
                                )}
                                {data.status}
                              </span>
                            </div>
                            {data.comment && (
                              <div className="flex items-start gap-2 mt-2 pl-2 border-l-2 border-zinc-700">
                                <MessageSquare className="w-3 h-3 text-zinc-500 mt-1 flex-shrink-0" />
                                <p className="text-zinc-400 text-sm">{data.comment}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Photos Section */}
        {(audit.photo_livre_police || audit.photo_erreur_1 || audit.photo_erreur_2) && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="border-b border-zinc-800">
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#FFD700]" />
                Photos
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {audit.photo_livre_police && (
                  <div className="space-y-2">
                    <p className="text-zinc-400 text-sm">Livre de Police</p>
                    <img
                      src={audit.photo_livre_police}
                      alt="Livre de Police"
                      className="w-full h-48 object-cover rounded-xl border border-zinc-800"
                      data-testid="photo-livre-police"
                    />
                  </div>
                )}
                {audit.photo_erreur_1 && (
                  <div className="space-y-2">
                    <p className="text-zinc-400 text-sm">Erreur 1</p>
                    <img
                      src={audit.photo_erreur_1}
                      alt="Erreur 1"
                      className="w-full h-48 object-cover rounded-xl border border-zinc-800"
                      data-testid="photo-erreur-1"
                    />
                  </div>
                )}
                {audit.photo_erreur_2 && (
                  <div className="space-y-2">
                    <p className="text-zinc-400 text-sm">Erreur 2</p>
                    <img
                      src={audit.photo_erreur_2}
                      alt="Erreur 2"
                      className="w-full h-48 object-cover rounded-xl border border-zinc-800"
                      data-testid="photo-erreur-2"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Observations Section */}
        {(audit.observations || audit.actions_correctives) && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="border-b border-zinc-800">
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#FFD700]" />
                Observations & Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {audit.observations && (
                <div>
                  <p className="text-zinc-400 text-sm mb-2">Observations</p>
                  <p className="text-white bg-zinc-800/50 p-4 rounded-xl" data-testid="observations-text">
                    {audit.observations}
                  </p>
                </div>
              )}
              {audit.actions_correctives && (
                <div>
                  <p className="text-zinc-400 text-sm mb-2">Actions correctives</p>
                  <p className="text-white bg-zinc-800/50 p-4 rounded-xl" data-testid="actions-text">
                    {audit.actions_correctives}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Signatures Section */}
        {(audit.signature_commercial || audit.signature_controleur) && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="border-b border-zinc-800">
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <FileSignature className="w-5 h-5 text-[#FFD700]" />
                Signatures
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {audit.signature_commercial && (
                  <div className="space-y-2">
                    <p className="text-zinc-400 text-sm">Signature Commercial</p>
                    <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800">
                      <img
                        src={audit.signature_commercial}
                        alt="Signature Commercial"
                        className="w-full h-24 object-contain"
                        data-testid="signature-commercial-img"
                      />
                    </div>
                  </div>
                )}
                {audit.signature_controleur && (
                  <div className="space-y-2">
                    <p className="text-zinc-400 text-sm">Signature Contrôleur</p>
                    <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800">
                      <img
                        src={audit.signature_controleur}
                        alt="Signature Contrôleur"
                        className="w-full h-24 object-contain"
                        data-testid="signature-controleur-img"
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
