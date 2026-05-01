import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:webview_flutter_android/webview_flutter_android.dart';
import '../theme.dart';

class _MenuItem {
  final String title;
  final IconData icon;
  final String tab;

  const _MenuItem({
    required this.title,
    required this.icon,
    required this.tab,
  });
}

const _baseUrl = 'https://gondolas-suprema.vercel.app';

const _menuItems = <_MenuItem>[
  _MenuItem(title: 'Início', icon: Icons.home, tab: 'home'),
  _MenuItem(title: 'Catálogo', icon: Icons.grid_view_rounded, tab: 'catalogo'),
  _MenuItem(title: 'Orçamento', icon: Icons.receipt_long, tab: 'orcamento'),
  _MenuItem(title: 'Resumo', icon: Icons.summarize, tab: 'resumo'),
  _MenuItem(title: 'Pedidos', icon: Icons.assignment, tab: 'pedidos'),
  _MenuItem(title: 'Financeiro', icon: Icons.account_balance_wallet, tab: 'financeiro'),
  _MenuItem(title: 'DRE', icon: Icons.analytics, tab: 'dre'),
  _MenuItem(title: 'NF-e', icon: Icons.description, tab: 'nfe'),
  _MenuItem(title: 'Conciliação', icon: Icons.compare_arrows, tab: 'conciliacao'),
  _MenuItem(title: 'Gráficos', icon: Icons.bar_chart, tab: 'graficos'),
  _MenuItem(title: 'Admin', icon: Icons.admin_panel_settings, tab: 'admin'),
];

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  late final WebViewController _controller;
  int _selectedIndex = 0;
  bool _loading = true;

  @override
  void initState() {
    super.initState();

    late final PlatformWebViewControllerCreationParams params;
    if (WebViewPlatform.instance is AndroidWebViewPlatform) {
      params = AndroidWebViewControllerCreationParams();
    } else {
      params = const PlatformWebViewControllerCreationParams();
    }

    _controller = WebViewController.fromPlatformCreationParams(params)
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(AppColors.bg)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (_) => setState(() => _loading = true),
          onPageFinished: (_) {
            setState(() => _loading = false);
            _navigateToTab(_menuItems[_selectedIndex].tab);
          },
        ),
      )
      ..loadRequest(Uri.parse(_baseUrl));
  }

  Future<void> _navigateToTab(String tab) async {
    if (tab == 'home') return;
    final js = '''
      (function() {
        const labels = {
          'catalogo': ['Catálogo', 'Catalogo'],
          'orcamento': ['Orçamento', 'Orcamento'],
          'resumo': ['Resumo'],
          'pedidos': ['Pedidos'],
          'financeiro': ['Financeiro'],
          'dre': ['DRE'],
          'nfe': ['NF-e', 'NFe', 'NF'],
          'conciliacao': ['Conciliação', 'Conciliacao'],
          'graficos': ['Gráficos', 'Graficos'],
          'admin': ['Admin']
        };
        const targets = labels['$tab'] || [];
        const buttons = Array.from(document.querySelectorAll('button, a, [role="button"]'));
        for (const target of targets) {
          const btn = buttons.find(b => (b.textContent || '').trim() === target);
          if (btn) { btn.click(); return true; }
        }
        return false;
      })();
    ''';
    try {
      await _controller.runJavaScript(js);
    } catch (_) {}
  }

  void _selectTab(int index) {
    setState(() => _selectedIndex = index);
    Navigator.pop(context);
    _navigateToTab(_menuItems[index].tab);
  }

  @override
  Widget build(BuildContext context) {
    final item = _menuItems[_selectedIndex];

    return Scaffold(
      appBar: AppBar(
        title: Text(item.title),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Recarregar',
            onPressed: () => _controller.reload(),
          ),
        ],
      ),
      drawer: Drawer(
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            DrawerHeader(
              decoration: const BoxDecoration(color: AppColors.bg),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Container(
                    height: 44,
                    width: 44,
                    decoration: BoxDecoration(
                      color: AppColors.accent,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.store, color: Colors.black),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Gôndolas Suprema',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Sistema interno',
                    style: TextStyle(color: AppColors.textMuted, fontSize: 12),
                  ),
                ],
              ),
            ),
            for (var i = 0; i < _menuItems.length; i++)
              ListTile(
                leading: Icon(
                  _menuItems[i].icon,
                  color: i == _selectedIndex ? AppColors.accent : AppColors.textMuted,
                ),
                title: Text(
                  _menuItems[i].title,
                  style: TextStyle(
                    color: i == _selectedIndex ? AppColors.accent : AppColors.text,
                    fontWeight: i == _selectedIndex ? FontWeight.w600 : FontWeight.normal,
                  ),
                ),
                selected: i == _selectedIndex,
                selectedTileColor: AppColors.card,
                onTap: () => _selectTab(i),
              ),
            const Divider(color: AppColors.border, height: 32),
            ListTile(
              leading: const Icon(Icons.open_in_browser, color: AppColors.textMuted),
              title: const Text('Abrir no navegador',
                  style: TextStyle(color: AppColors.textMuted)),
              onTap: () {
                Navigator.pop(context);
                _controller.loadRequest(Uri.parse(_baseUrl));
              },
            ),
          ],
        ),
      ),
      body: Stack(
        children: [
          WebViewWidget(controller: _controller),
          if (_loading)
            const LinearProgressIndicator(
              backgroundColor: AppColors.surface,
              valueColor: AlwaysStoppedAnimation(AppColors.accent),
            ),
        ],
      ),
    );
  }
}
