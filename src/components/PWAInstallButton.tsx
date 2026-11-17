
import { useCallback, useEffect, useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
};

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function hasAuthenticatedSession() {
  try {
    return Boolean(
      localStorage.getItem('byse_token') &&
      localStorage.getItem('byse_user')
    );
  } catch {
    return false;
  }
}

export default function PWAInstallButton() {
  const [authenticated, setAuthenticated] = useState(
    hasAuthenticatedSession
  );

  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);

  const [installed, setInstalled] = useState(isStandalone);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const refreshSession = () => {
      const active = hasAuthenticatedSession();

      setAuthenticated(active);

      if (!active) {
        setHidden(false);
      }
    };

    refreshSession();

    const poll = window.setInterval(refreshSession, 1000);

    window.addEventListener('storage', refreshSession);
    window.addEventListener('focus', refreshSession);

    return () => {
      window.clearInterval(poll);

      window.removeEventListener('storage', refreshSession);
      window.removeEventListener('focus', refreshSession);
    };
  }, []);

  // Ouvintes ficam ativos desde a montagem.
  // O navegador decide quando o prompt está disponível.
  useEffect(() => {
    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();

      console.info(
        '[BYSE PWA] Evento beforeinstallprompt recebido.'
      );

      setInstallEvent(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setInstalled(true);
      setInstallEvent(null);
    };

    window.addEventListener(
      'beforeinstallprompt',
      handleBeforeInstall
    );

    window.addEventListener(
      'appinstalled',
      handleInstalled
    );

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstall
      );

      window.removeEventListener(
        'appinstalled',
        handleInstalled
      );
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (installEvent) {
      try {
        await installEvent.prompt();

        const choice = await installEvent.userChoice;

        if (choice.outcome === 'accepted') {
          setInstalled(true);
          setInstallEvent(null);
        }
      } catch (error) {
        console.error(
          '[BYSE PWA] Erro ao abrir o prompt:',
          error
        );

        window.alert(
          'Não foi possível abrir a instalação agora. Atualize a página e tente novamente.'
        );
      }

      return;
    }

    const ua = navigator.userAgent;

    const isIOS =
      /iPad|iPhone|iPod/.test(ua) ||
      (
        navigator.platform === 'MacIntel' &&
        navigator.maxTouchPoints > 1
      );

    const isOpera = /OPR\//.test(ua);

    if (isIOS) {
      window.alert(
        'Para instalar o BYSE PRO no iPhone ou iPad:\n\n' +
        '1. Abra este site no Safari.\n' +
        '2. Toque em Compartilhar.\n' +
        '3. Escolha “Adicionar à Tela de Início”.\n' +
        '4. Confirme em “Adicionar”.'
      );

      return;
    }

    if (isOpera) {
      window.alert(
        'O Opera não disponibilizou o comando automático de instalação para esta página.\n\n' +
        'Verifique se o site está publicado em HTTPS e se o manifesto e o Service Worker estão ativos. ' +
        'No Opera para computador, abra o menu principal e procure “Instalar BYSE PRO” ou “Criar atalho”. ' +
        'Se a opção não existir, use o Chrome ou Edge para instalar o PWA.'
      );

      return;
    }

    window.alert(
      'O navegador ainda não liberou a instalação automática do BYSE PRO.\n\n' +
      'Confira se o site está em HTTPS, atualize a página e aguarde alguns segundos. ' +
      'No Chrome ou Edge, abra o menu do navegador e procure “Instalar BYSE PRO”.'
    );
  }, [installEvent]);

  if (!authenticated || installed || hidden) {
    return null;
  }

  return (
    <div
      className="byse-install-wrap"
      role="region"
      aria-label="Instalar BYSE PRO"
    >
      <button
        type="button"
        className="byse-install-button"
        onClick={handleInstall}
        aria-label="Instalar aplicativo BYSE PRO"
      >
        <span className="byse-install-icon">
          <Download size={17} strokeWidth={2.5} />
        </span>

        <span className="byse-install-copy">
          <strong>Instalar aplicativo</strong>
          <small>
            Tenha o BYSE PRO na sua tela inicial
          </small>
        </span>

        <Smartphone
          className="byse-install-phone"
          size={18}
        />
      </button>

      <button
        type="button"
        className="byse-install-dismiss"
        onClick={() => setHidden(true)}
        aria-label="Fechar botão de instalação"
        title="Agora não"
      >
        <X size={13} />
      </button>
    </div>
  );
}
