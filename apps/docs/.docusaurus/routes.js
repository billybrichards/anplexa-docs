import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/__docusaurus/debug',
    component: ComponentCreator('/__docusaurus/debug', '5ff'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/config',
    component: ComponentCreator('/__docusaurus/debug/config', '5ba'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/content',
    component: ComponentCreator('/__docusaurus/debug/content', 'a2b'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/globalData',
    component: ComponentCreator('/__docusaurus/debug/globalData', 'c3c'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/metadata',
    component: ComponentCreator('/__docusaurus/debug/metadata', '156'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/registry',
    component: ComponentCreator('/__docusaurus/debug/registry', '88c'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/routes',
    component: ComponentCreator('/__docusaurus/debug/routes', '000'),
    exact: true
  },
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
