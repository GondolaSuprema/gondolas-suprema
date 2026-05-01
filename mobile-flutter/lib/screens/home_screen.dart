import 'package:flutter/material.dart';
import '../services/supabase_service.dart';
import '../theme.dart';
import 'login_screen.dart';
import 'placeholder_screen.dart';

class _MenuItem {
  final String title;
  final IconData icon;
  final String description;
  final bool adminOnly;

  const _MenuItem({
    required this.title,
    required this.icon,
    required this.description,
    this.adminOnly = false,
  });
}

const _menuItems = <_MenuItem>[
  _MenuItem(
    title: 'Catálogo',
    icon: Icons.grid_view_rounded,
    description: 'Produtos e variantes disponíveis para orçamento.',
  ),
  _MenuItem(
    title: 'Orçamento',
    icon: Icons.receipt_long,
    description: 'Monta orçamentos com cálculo de comissão e PDF.',
  ),
  _MenuItem(
    title: 'Resumo',
    icon: Icons.summarize,
    description: 'Painel de resumo do mês — vendas, ticket, ranking.',
  ),
  _MenuItem(
    title: 'Pedidos',
    icon: Icons.assignment,
    description: 'Lista de pedidos com filtros e status de entrega.',
  ),
  _MenuItem(
    title: 'Financeiro',
    icon: Icons.account_balance_wallet,
    description: 'Despesas, fluxo de caixa e categorização.',
    adminOnly: true,
  ),
  _MenuItem(
    title: 'DRE',
    icon: Icons.analytics,
    description: 'Demonstrativo de resultado por período.',
    adminOnly: true,
  ),
  _MenuItem(
    title: 'NF-e',
    icon: Icons.description,
    description: 'Emissão e consulta de notas fiscais eletrônicas.',
    adminOnly: true,
  ),
  _MenuItem(
    title: 'Conciliação',
    icon: Icons.compare_arrows,
    description: 'Conciliação bancária com vendas e despesas.',
    adminOnly: true,
  ),
  _MenuItem(
    title: 'Gráficos',
    icon: Icons.bar_chart,
    description: 'Visualização de métricas e tendências.',
    adminOnly: true,
  ),
  _MenuItem(
    title: 'Admin',
    icon: Icons.admin_panel_settings,
    description: 'Gestão de usuários, produtos e configurações.',
    adminOnly: true,
  ),
];

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0;

  String get _userName {
    final meta = supabase.auth.currentUser?.userMetadata;
    return (meta?['name'] as String?) ?? supabase.auth.currentUser?.email ?? 'Usuário';
  }

  bool get _isAdmin {
    final meta = supabase.auth.currentUser?.userMetadata;
    return meta?['isAdmin'] == true;
  }

  Future<void> _signOut() async {
    await supabase.auth.signOut();
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    final item = _menuItems[_selectedIndex];

    return Scaffold(
      appBar: AppBar(
        title: Text(item.title),
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
                  Text(
                    _userName,
                    style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
                  ),
                ],
              ),
            ),
            for (var i = 0; i < _menuItems.length; i++)
              if (!_menuItems[i].adminOnly || _isAdmin)
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
                  onTap: () {
                    setState(() => _selectedIndex = i);
                    Navigator.pop(context);
                  },
                ),
            const Divider(color: AppColors.border, height: 32),
            ListTile(
              leading: const Icon(Icons.logout, color: AppColors.danger),
              title: const Text('Sair', style: TextStyle(color: AppColors.danger)),
              onTap: _signOut,
            ),
          ],
        ),
      ),
      body: PlaceholderScreen(
        title: item.title,
        icon: item.icon,
        description: item.description,
      ),
    );
  }
}
