# Gôndolas Suprema — App Mobile (Flutter)

App mobile da Gôndolas Suprema. Carrega o site (https://gondolas-suprema.vercel.app) numa WebView nativa, com **drawer (menu sanduíche) Flutter** controlando a navegação.

## Funcionalidades

- ✅ **TODAS as funcionalidades do site** — orçamento, catálogo, financeiro, NF-e, gráficos, etc.
- ✅ **Drawer (menu sanduíche)** com 11 itens — toca o ícone ≡ no canto superior esquerdo
- ✅ **Login do site** funciona normalmente dentro da WebView (Supabase Auth)
- ✅ **Atualização automática** — qualquer mudança no site reflete no app sem republicar
- ✅ **Tema escuro** com paleta da marca

## Como o drawer navega

Cada item do drawer roda um **JavaScript injetado na WebView** que clica no botão correspondente do menu interno do site (ex: "Catálogo", "Orçamento", "NF-e"). Se algum item não encontrar o botão, ele só permanece na página atual — não quebra.

## Estrutura

```
mobile-flutter/
├── lib/
│   ├── main.dart            # Bootstrap
│   ├── theme.dart           # Paleta + tema escuro
│   └── screens/
│       └── home_screen.dart # WebView + Drawer
└── pubspec.yaml             # webview_flutter + google_fonts
```

## Como rodar localmente (programador)

Pré-requisitos: Flutter SDK 3.4+, Android Studio, JDK 17.

```bash
cd mobile-flutter
flutter create --org com.gondolasuprema --project-name gondolas_suprema --platforms=android .
flutter pub get
flutter run                 # roda no emulador/celular conectado
flutter build apk --debug   # gera APK debug
flutter build apk --release # gera APK release (precisa de keystore)
```

> O comando `flutter create` é necessário porque a pasta `android/` não está commitada — ela é gerada a cada build.

## Build automático no GitHub Actions

Workflow `.github/workflows/build-flutter-apk.yml` roda em todo push que mexer em `mobile-flutter/`. APK fica disponível em **Actions → Artifacts → gondolas-suprema-flutter-apk**.

## Próximos passos pro programador (opcionais)

1. **Adicionar features nativas** que a WebView não dá:
   - Câmera pra fotografar produto e anexar no orçamento
   - Scanner de código de barras
   - Push notifications
   - Compartilhamento nativo de PDF
2. **Reescrever telas em Flutter nativo** progressivamente — começar pelo Catálogo (mais usado), substituir o WebView só nesse item do drawer
3. **Login nativo** (opcional) — se quiser autenticação mais robusta, usar `supabase_flutter` antes da WebView e injetar o token

## Convivência com o app Capacitor

Os dois apps coexistem no repo:
- `android/` (gerado pelo Capacitor) — versão simples, só WebView fullscreen do site
- `mobile-flutter/` — Flutter com drawer nativo + WebView, base pra evoluir nativamente

Ambos consomem o mesmo backend Supabase + Vercel. Não há código duplicado de lógica de negócio.
