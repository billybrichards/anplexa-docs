/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  tutorialSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Architecture',
      items: [
        'architecture/clean-architecture-audit',
        'architecture/repository-pattern',
        'architecture/dependency-injection',
      ],
    },
    {
      type: 'category',
      label: 'Development',
      items: [
        'development/monorepo-guide',
      ],
    },
    {
      type: 'category',
      label: 'Frontend',
      items: [
        'frontend/custom-hooks',
      ],
    },
    {
      type: 'category',
      label: 'Improvement Plans',
      items: [
        'improvement-plans/clean-architecture-transition',
      ],
    },
  ],
};

module.exports = sidebars;
