import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { 
  Plus, 
  Search, 
  LogOut, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  MapPin, 
  User, 
  MoreVertical,
  Download,
  Eye,
  Trash2,
  ClipboardCheck,
  Shield,
  TrendingUp
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function DashboardPage() {
  const { user, logout, api } = useAuth();
  const navigate = useNavigate();
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchAudits();
  }, []);

  const fetchAudits = async () => {
    try {
      const response = await api.get("/audits");
      setAudits(response.data);
    } catch (err) {
      toast.error("Erreur lors du chargement des audits");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async (auditId, commercialName, dateControle) => {
    try {
      const response = await api.get(`/audits/${auditId}/pdf`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `PV_Audit_${commercialName}_${dateControle}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("PDF téléchargé avec succès");
    } catch (err) {
      toast.error("Erreur lors du téléchargement du PDF");
    }
  };

  const handleDeleteAudit = async (auditId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet audit ?")) return;
    
    try {
      await api.delete(`/audits/${auditId}`);
      setAudits(audits.filter((a) => a.id !== auditId));
      toast.success("Audit supprimé avec succès");
    } catch (err) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const filteredAudits = audits.filter(
    (audit) =>
      audit.commercial_controle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      audit.lieu.toLowerCase().includes(searchTerm.toLowerCase()) ||
      audit.controleur_interne.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: audits.length,
    conformes: audits.filter((a) => a.resultat_global === "CONFORME").length,
    nonConformes: audits.filter((a) => a.resultat_global === "NON CONFORME").length,
  };

  const conformityRate = stats.total > 0 ? Math.round((stats.conformes / stats.total) * 100) : 0;

  return (
    <div className="min-h-screen rafy-bg">
      {/* Header */}
      <header className="glass sticky top-0 z-50 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FFD700] flex items-center justify-center">
                <Shield className="w-5 h-5 text-black" />
              </div>
              <h1 className="text-xl font-bold text-[#FFD700]" style={{ fontFamily: "'Playfair Display', serif" }}>
                RAFY GOLD
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-zinc-400 text-sm hidden sm:block">
                {user?.name}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                data-testid="logout-btn"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger-children">
          <Card className="bg-zinc-900 border-zinc-800 card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-sm">Total Audits</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.total}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-[#FFD700]/10 flex items-center justify-center">
                  <ClipboardCheck className="w-6 h-6 text-[#FFD700]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800 card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-sm">Conformes</p>
                  <p className="text-3xl font-bold text-emerald-500 mt-1">{stats.conformes}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800 card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-sm">Non Conformes</p>
                  <p className="text-3xl font-bold text-red-500 mt-1">{stats.nonConformes}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800 card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-sm">Taux Conformité</p>
                  <p className="text-3xl font-bold text-[#FFD700] mt-1">{conformityRate}%</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-[#FFD700]/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-[#FFD700]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              placeholder="Rechercher un audit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-zinc-900 border-zinc-800 focus:border-[#FFD700] h-12"
              data-testid="search-input"
            />
          </div>
          <Button
            onClick={() => navigate("/audit/new")}
            className="btn-gold h-12 px-6"
            data-testid="new-audit-btn"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nouveau Contrôle
          </Button>
        </div>

        {/* Audits List */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="border-b border-zinc-800">
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#FFD700]" />
              Historique des Audits
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 shimmer rounded-lg" />
                ))}
              </div>
            ) : filteredAudits.length === 0 ? (
              <div className="p-12 text-center">
                <ClipboardCheck className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">
                  {searchTerm ? "Aucun résultat" : "Aucun audit"}
                </h3>
                <p className="text-zinc-500 mb-6">
                  {searchTerm
                    ? "Essayez avec d'autres termes de recherche"
                    : "Commencez par créer votre premier contrôle interne"}
                </p>
                {!searchTerm && (
                  <Button
                    onClick={() => navigate("/audit/new")}
                    className="btn-gold"
                    data-testid="empty-new-audit-btn"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Créer un audit
                  </Button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-zinc-800">
                {filteredAudits.map((audit) => (
                  <div
                    key={audit.id}
                    className="p-4 sm:p-6 hover:bg-zinc-800/50 transition-colors"
                    data-testid={`audit-item-${audit.id}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-white truncate">
                            {audit.commercial_controle}
                          </h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              audit.resultat_global === "CONFORME"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {audit.resultat_global}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-zinc-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {audit.date_controle}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {audit.lieu}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {audit.controleur_interne}
                          </span>
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-zinc-400 hover:text-white"
                            data-testid={`audit-menu-${audit.id}`}
                          >
                            <MoreVertical className="w-5 h-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                          <DropdownMenuItem
                            onClick={() => navigate(`/audit/${audit.id}`)}
                            className="cursor-pointer hover:bg-zinc-800"
                            data-testid={`view-audit-${audit.id}`}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Voir détails
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDownloadPdf(audit.id, audit.commercial_controle, audit.date_controle)}
                            className="cursor-pointer hover:bg-zinc-800"
                            data-testid={`download-pdf-${audit.id}`}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Télécharger PDF
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-zinc-800" />
                          <DropdownMenuItem
                            onClick={() => handleDeleteAudit(audit.id)}
                            className="cursor-pointer text-red-400 hover:bg-red-500/10 hover:text-red-400"
                            data-testid={`delete-audit-${audit.id}`}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
