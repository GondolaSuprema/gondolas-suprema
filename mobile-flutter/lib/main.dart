import 'package:flutter/material.dart';
import 'services/supabase_service.dart';
import 'theme.dart';
import 'screens/login_screen.dart';
import 'screens/home_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initSupabase();
  runApp(const GondolasApp());
}

class GondolasApp extends StatelessWidget {
  const GondolasApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Gôndolas Suprema',
      theme: buildAppTheme(),
      debugShowCheckedModeBanner: false,
      home: supabase.auth.currentSession != null
          ? const HomeScreen()
          : const LoginScreen(),
    );
  }
}
