/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  docsSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Architecture',
      items: [
        'architecture/overview',
        'architecture/backend-api',
        'architecture/companions-app',
        'architecture/marketing-funnel',
        'architecture/data-flow',
      ],
    },
    {
      type: 'category',
      label: 'User Flows',
      items: [
        'user-flows/authentication',
        'user-flows/chat',
        'user-flows/subscription',
        'user-flows/funnel-conversion',
      ],
    },
    {
      type: 'category',
      label: 'API Reference',
      items: [
        'api/authentication',
        'api/chat',
        'api/conversations',
        'api/settings',
        'api/stripe',
        'api/admin',
      ],
    },
    {
      type: 'category',
      label: 'Security',
      items: [
        'security/overview',
        'security/authentication-security',
      ],
    },
    {
      type: 'category',
      label: 'Development',
      items: [
        'development/getting-started',
        'development/environment-setup',
        'development/testing',
      ],
    },
    {
      type: 'category',
      label: 'Improvement Plans',
      items: [
        'improvement-plans/roadmap',
        'improvement-plans/clean-architecture-transition',
        'improvement-plans/backend-improvements',
        'improvement-plans/frontend-improvements',
        'improvement-plans/funnel-improvements',
        'improvement-plans/monorepo-migration',
      ],
    },
  ],
};

export default sidebars;
