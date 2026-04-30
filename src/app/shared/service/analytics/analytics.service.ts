import { Injectable } from "@angular/core";
import { Database, ref, push } from "@angular/fire/database";
import { Path } from "../../model/path.enum";
import { Analytics } from "../../model/analytics-model";
import { DatePipe } from "@angular/common";
import { environment } from "src/environments/environment";


export interface PageViewOptions {
  /** Nome do componente/tela aberta (ex.: 'feed', 'detalhe-produto') */
  funcionalidade: string;
  /** Nome do produto — somente para telas de produto */
  produto_nome?: string;
  /** Marca do produto — somente para telas de produto */
  produto_marca?: string;
  /** Parâmetros extras livres */
  extra?: Record<string, any>;
}

// Tempo máximo aguardando o perfil antes de descarregar a fila com o valor padrão
const PROFILE_READY_TIMEOUT_MS = 4000;

@Injectable({
  providedIn: "root",
})
export class AnalyticsService {
  private perfilUsuario = "cliente";
  private profileReady = false;
  private pendingPageViews: Array<() => void> = [];
  private profileReadyTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(private db: Database, private datePipe: DatePipe) {
    // Garante que a fila seja descarregada mesmo se o perfil nunca chegar
    this.profileReadyTimeout = setTimeout(() => {
      this.markProfileReady();
    }, PROFILE_READY_TIMEOUT_MS);
  }

  // ─── Perfil do usuário ────────────────────────────────────────────────────

  /**
   * Chamado quando o perfil da conta é carregado (usuário autenticado).
   * Seta o perfil e descarrega a fila de page views pendentes.
   */
  setUserProfile(perfil: string | null): void {
    this.perfilUsuario = perfil ?? "cliente";
    this.markProfileReady();
  }

  /**
   * Chamado quando se sabe que o usuário é anônimo (sem token).
   * Descarrega a fila com o perfil padrão "cliente".
   */
  markProfileReady(): void {
    if (this.profileReady) return;
    this.profileReady = true;
    if (this.profileReadyTimeout !== null) {
      clearTimeout(this.profileReadyTimeout);
      this.profileReadyTimeout = null;
    }
    this.pendingPageViews.forEach((fn) => fn());
    this.pendingPageViews = [];
  }

  // ─── Firebase (visitante anônimo) ────────────────────────────────────────

  newAnalytics() {
    const flagAnalytics = sessionStorage.getItem(Path.ANALYTICS) ?? null;
    const token = localStorage.getItem(Path.TOKEN) ?? null;
    const analytics: Analytics = {
      data: this.datePipe.transform(Date.now(), "dd/MM/yyyy HH:mm:ss"),
      user_agent: navigator.userAgent,
    };
    if (flagAnalytics !== "true" && token === null) {
      push(ref(this.db, Path.ANALYTICS), analytics).then(() => {
        sessionStorage.setItem(Path.ANALYTICS, "true");
      });
    }
  }

  // ─── GA4 / GTM ───────────────────────────────────────────────────────────

  /**
   * Dispara um page_view no GA4 com parâmetros padrão obrigatórios.
   * Se o perfil do usuário ainda não foi carregado, enfileira o disparo
   * e executa assim que o perfil estiver disponível.
   *
   * Parâmetros sempre enviados:
   *   evento, funcionalidade, detail, perfilUsuario, page_path, page_title
   *
   * Parâmetros opcionais (apenas telas de produto):
   *   nome, marca
   */
  pageView(options: PageViewOptions): void {
    if (!this.profileReady) {
      this.pendingPageViews.push(() => this.firePageView(options));
      return;
    }
    this.firePageView(options);
  }

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-");
  }

  private firePageView(options: PageViewOptions): void {
    const path = window.location.pathname;
    const fullUrl = window.location.href;
    const { funcionalidade, produto_nome, produto_marca, extra = {} } = options;

    this.gtag("event", "page_view", {
      page_path: path,
      page_title: document.title,
      evento: "page_view",
      funcionalidade,
      detail: path,
      full_url: fullUrl,
      perfilUsuario: this.perfilUsuario,
      debug_mode: !environment.production,
      ...(produto_nome ? { produto_nome: this.slugify(produto_nome) } : {}),
      ...(produto_marca ? { produto_marca } : {}),
      ...extra,
    });
  }

  /**
   * Dispara um evento de clique genérico.
   *
   * @param label     Identificador do elemento clicado (ex.: 'btn-ver-detalhes')
   * @param category  Categoria do clique (ex.: 'produto', 'menu', 'footer')
   * @param params    Parâmetros extras enviados junto ao evento
   */
  trackClick(
    label: string,
    category: string,
    params: Record<string, any> = {}
  ): void {
    this.gtag("event", "click", {
      evento: "click",
      event_category: category,
      event_label: label,
      full_url: window.location.href,
      perfilUsuario: this.perfilUsuario,
      ...params,
    });
  }

  /**
   * Dispara qualquer evento GA4 com parâmetros livres.
   *
   * @param eventName Nome do evento (ex.: 'add_to_cart', 'share')
   * @param params    Parâmetros do evento
   */
  trackEvent(eventName: string, params: Record<string, any> = {}): void {
    this.gtag("event", eventName, params);
  }

  // ─── Privado ─────────────────────────────────────────────────────────────

  private gtag(...args: any[]): void {
    if (typeof (window as any).gtag === "function") {
      (window as any).gtag(...args);
    }
  }
}
