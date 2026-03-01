const ROUTING_RULES: Array<{ intent: string; agent: string; keywords: string[] }> = [
  {
    intent: 'browser.login',
    agent: 'browser-login',
    keywords: ['login', 'browser', 'portal', 'cookie', 'captcha']
  },
  {
    intent: 'deploy.coolify',
    agent: 'coolify-ops',
    keywords: ['coolify', 'deploy', 'release', 'rollback', 'service up', 'service down']
  },
  {
    intent: 'research.analysis',
    agent: 'research',
    keywords: ['investiga', 'analiza', 'research', 'comparar', 'resumen', 'benchmark']
  }
];

export function classifyIntent(text: string): { intent: string; targetAgent: string } {
  const lowered = text.toLowerCase();
  for (const rule of ROUTING_RULES) {
    if (rule.keywords.some((word) => lowered.includes(word))) {
      return { intent: rule.intent, targetAgent: rule.agent };
    }
  }

  return { intent: 'general.main', targetAgent: 'main' };
}

export function actionNeedsConfirmation(text: string): boolean {
  const lowered = text.toLowerCase();
  return ['delete', 'drop', 'destroy', 'stop', 'down', 'wipe', 'rm -rf', 'shutdown'].some((token) =>
    lowered.includes(token)
  );
}
