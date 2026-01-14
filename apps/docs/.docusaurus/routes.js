import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/docs',
    component: ComponentCreator('/docs', '30b'),
    routes: [
      {
        path: '/docs',
        component: ComponentCreator('/docs', '342'),
        routes: [
          {
            path: '/docs',
            component: ComponentCreator('/docs', 'c1e'),
            routes: [
              {
                path: '/docs/architecture/clean-architecture-audit',
                component: ComponentCreator('/docs/architecture/clean-architecture-audit', '956'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/architecture/dependency-injection',
                component: ComponentCreator('/docs/architecture/dependency-injection', 'df6'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/architecture/repository-pattern',
                component: ComponentCreator('/docs/architecture/repository-pattern', 'fbf'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/development/monorepo-guide',
                component: ComponentCreator('/docs/development/monorepo-guide', 'f8d'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/frontend/custom-hooks',
                component: ComponentCreator('/docs/frontend/custom-hooks', '2b3'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/improvement-plans/clean-architecture-transition',
                component: ComponentCreator('/docs/improvement-plans/clean-architecture-transition', 'd44'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/intro',
                component: ComponentCreator('/docs/intro', '61d'),
                exact: true,
                sidebar: "tutorialSidebar"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
