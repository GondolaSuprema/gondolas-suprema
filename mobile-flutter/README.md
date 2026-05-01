# Gôndolas Suprema — App Mobile (Flutter)

App nativo Flutter da Gôndolas Suprema. Conecta no **mesmo Supabase** que o site (https://gondolas-suprema.vercel.app).

## Status atual

- ✅ Login funcional (Supabase Auth) — usa os mesmos usuários do site
- ✅ Drawer (menu sanduíche) com 11 itens
- ✅ Tema escuro com paleta da marca (laranja `#F5A623`)
- ✅ Permissão admin (vendedor não vê Financeiro/DRE/NFe/Conciliação/Gráficos/Admin)
- ⏳ Telas internas — todas em **placeholder**, prontas pro programador implementar

## Telas a implementar (por prioridade sugerida)

1. **Catálogo** — listar produtos hardcoded + categoria "Outros Produtos" (tabela `produtos_uniplus` no Supabase)
2. **Orçamento** — montar carrinho, calcular comissão, gerar PDF compartilhável
3. **Pedidos** — listar com filtros, status entrega
4. **Resumo** — métricas do mês
5. **Financeiro / DRE / NFe / Conciliação / Gráficos / Admin** — réplicas das telas web

## Estrutura

```
mobile-flutter/
├── lib/
│   ├── main.dart                    # Bootstrap + roteamento auth
│   ├── theme.dart                   # Paleta + tema Material 3 escuro
│   ├── services/
│   │   └── supabase_service.dart    # Inicialização do Supabase
│   └── screens/
│       ├── login_screen.dart        # ✅ Pronta
│       ├── home_screen.dart         # ✅ Drawer + roteamento interno
│       └── placeholder_screen.dart  # Tela genérica "Em desenvolvimento"
└── pubspec.yaml
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

Workflow `.github/workflows/build-flutter-apk.yml`:

- Roda em **todo push** que mexa em `mobile-flutter/`
- Gera scaffold Android + builda APK debug
- Disponibiliza em **Actions → Artifacts** como `gondolas-suprema-flutter-apk`

## Configuração Supabase

URL e publishable key estão em `lib/services/supabase_service.dart`. **Não precisam ficar em segredo** — RLS protege o acesso, e a publishable key é desenhada pra ser pública.

## Convivência com o app Capacitor

Os dois apps coexistem no repo:
- `android/` (gerado pelo Capacitor) — APK que abre o site numa WebView
- `mobile-flutter/` — app nativo Flutter, em desenvolvimento

Em produção, o programador pode escolher qual entregar pro time. Recomendado: usar **Capacitor enquanto Flutter não tiver paridade de telas**.
