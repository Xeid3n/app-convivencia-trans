// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

// --- INÍCIO DA CORREÇÃO ENCONTRADA PELA COMUNIDADE ---
// Adicionado para corrigir o bug de inicialização do Firebase Auth
defaultConfig.resolver.sourceExts.push('cjs');
defaultConfig.resolver.unstable_enablePackageExports = false;
// --- FIM DA CORREÇÃO ---

module.exports = defaultConfig;