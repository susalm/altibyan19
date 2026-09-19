import React, { Component, ErrorInfo, ReactNode } from "react";
import { RefreshCw, RotateCcw, AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[Tibyan ErrorBoundary] Uncaught runtime error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetAndReload = () => {
    try {
      localStorage.removeItem("quran_settings_tebyan");
      localStorage.removeItem("quran_khatmah_tebyan_plan");
      localStorage.removeItem("quran_theme");
      sessionStorage.clear();
    } catch (e) {
      console.warn("Could not clear storage:", e);
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          id="app-error-boundary"
          dir="rtl"
          className="fixed inset-0 bg-[#011c14] text-[#c5a85c] flex flex-col items-center justify-center p-6 text-center select-none z-[999999]"
        >
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-5 shadow-xl">
            <AlertTriangle className="w-8 h-8 text-amber-400" />
          </div>

          <h1 className="text-xl font-bold mb-2 text-[#e6cf8b]">
            مصحف التبيان الإلكتروني
          </h1>
          <p className="text-sm text-amber-200/80 max-w-sm mb-6 leading-relaxed">
            حدث خطأ غير متوقع أثناء معالجة البيانات أو رندرة الصفحة. يمكنك إعادة تحميل التطبيق بأمان.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs">
            <button
              id="reload-app-button"
              type="button"
              onClick={this.handleReload}
              className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-semibold text-sm shadow-lg transition-all active:scale-98 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>إعادة تشغيل التطبيق</span>
            </button>

            <button
              id="reset-settings-button"
              type="button"
              onClick={this.handleResetAndReload}
              className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-white/5 hover:bg-white/10 border border-[#c5a85c]/30 text-amber-200/90 font-medium text-xs transition-all active:scale-98 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>استعادة الإعدادات الافتراضية</span>
            </button>
          </div>

          {this.state.error && (
            <details className="mt-8 text-left text-[11px] text-amber-400/40 max-w-md w-full overflow-hidden">
              <summary className="cursor-pointer text-center text-amber-300/50 hover:text-amber-300/80 mb-2">
                تفاصيل الخطأ الفني (Technical Details)
              </summary>
              <pre className="p-3 bg-black/40 rounded-lg overflow-x-auto whitespace-pre-wrap font-mono text-[10px] text-amber-300/70 border border-white/5">
                {String(this.state.error?.message || this.state.error)}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
