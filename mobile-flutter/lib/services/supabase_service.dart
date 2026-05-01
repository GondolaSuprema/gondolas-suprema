import 'package:supabase_flutter/supabase_flutter.dart';

class SupabaseConfig {
  static const String url = 'https://euclqngycuqoftaryiyz.supabase.co';
  static const String publishableKey = 'sb_publishable_qONK-abETHVAh8CBECYCYg_w3hUL_j5';
}

Future<void> initSupabase() async {
  await Supabase.initialize(
    url: SupabaseConfig.url,
    anonKey: SupabaseConfig.publishableKey,
  );
}

SupabaseClient get supabase => Supabase.instance.client;
