/*
 * @rushstack/eslint-patch is used to include plugins as dev
 * dependencies instead of imposing them as peer dependencies
 *
 * https://www.npmjs.com/package/@rushstack/eslint-patch
 */
const keptPaths = [];
const sortedPaths = [];
const cwd = process.cwd().replace(/\\/g, "/");
const originalPaths = require.resolve.paths("eslint-plugin-import");

// eslint throws a conflict error when plugins resolve to different
// locations, since we want to lock our dependencies by default
// but also need to allow using user dependencies this updates
// our resolve paths to first check the cwd and iterate to
// eslint-config-next's dependencies if needed

for (let i = originalPaths.length - 1; i >= 0; i--) {
  const currentPath = originalPaths[i];

  if (currentPath.replace(/\\/g, "/").startsWith(cwd)) {
    sortedPaths.push(currentPath);
  } else {
    keptPaths.unshift(currentPath);
  }
}

// maintain order of node_modules outside of cwd
sortedPaths.push(...keptPaths);

const hookPropertyMap = new Map(
  [
    "@typescript-eslint/eslint-plugin",
    "eslint-plugin-import",
    "eslint-plugin-react",
    "eslint-plugin-jsx-a11y",
    "eslint-config-prettier",
  ].map((request) => [
    request,
    require.resolve(request, { paths: sortedPaths }),
  ])
);

const mod = require("module");
const resolveFilename = mod._resolveFilename;
mod._resolveFilename = function (request, parent, isMain, options) {
  const hookResolved = hookPropertyMap.get(request);
  if (hookResolved) {
    request = hookResolved;
  }
  return resolveFilename.call(mod, request, parent, isMain, options);
};

require("@rushstack/eslint-patch/modern-module-resolution");

/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:import/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:@next/next/recommended",
    "plugin:@next/next/core-web-vitals",
    "prettier",
  ],
  plugins: ["import", "react", "jsx-a11y"],
  rules: {
    "no-console": ["warn", { allow: ["warn", "error"] }],

    "import/consistent-type-specifier-style": ["error", "prefer-top-level"],
    "import/no-anonymous-default-export": "warn",
    "import/no-extraneous-dependencies": "error",
    "import/prefer-default-export": "off",

    "react/no-unknown-property": [
      "warn",
      { ignore: ["jsx", "cmdk-input-wrapper"] },
    ],
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    "react/jsx-curly-brace-presence": [
      "error",
      { props: "never", children: "never", propElementValues: "always" },
    ],
    "react/jsx-no-target-blank": "off",

    "jsx-a11y/alt-text": [
      "warn",
      {
        elements: ["img"],
        img: ["Image"],
      },
    ],
    "jsx-a11y/aria-props": "warn",
    "jsx-a11y/aria-proptypes": "warn",
    "jsx-a11y/aria-unsupported-elements": "warn",
    "jsx-a11y/role-has-required-aria-props": "warn",
    "jsx-a11y/role-supports-aria-props": "warn",

    "@next/next/no-html-link-for-pages": "off",
  },
  parser: "./parser.js",
  parserOptions: {
    requireConfigFile: false,
    sourceType: "module",
    allowImportExportEverywhere: true,
    babelOptions: {
      presets: ["next/babel"],
      caller: {
        // Eslint supports top level await when a parser for it is included. We enable the parser by default for Babel.
        supportsTopLevelAwait: true,
      },
    },
  },
  overrides: [
    {
      files: ["**/*.ts?(x)"],
      parser: "@typescript-eslint/parser",
      parserOptions: {
        sourceType: "module",
        project: "./tsconfig.json", // Add this line to enable type-aware linting
      },
      extends: [
        "plugin:@typescript-eslint/recommended-type-checked",
        "plugin:@typescript-eslint/stylistic-type-checked",
        "plugin:import/typescript",
      ],
      rules: {
        "@typescript-eslint/no-unused-vars": [
          "warn",
          { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
        ],
        "@typescript-eslint/consistent-type-imports": [
          "warn",
          { prefer: "type-imports", fixStyle: "separate-type-imports" },
        ],
        "@typescript-eslint/no-misused-promises": [
          "error",
          { checksVoidReturn: { attributes: false } },
        ],
        "@typescript-eslint/require-await": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/ban-ts-comment": "off",
        "@typescript-eslint/prefer-nullish-coalescing": "off",
      },
    },
  ],
  settings: {
    react: {
      version: "detect",
    },
    "import/parsers": {
      [require.resolve("@typescript-eslint/parser")]: [
        ".ts",
        ".mts",
        ".cts",
        ".tsx",
        ".d.ts",
      ],
    },
    "import/resolver": {
      [require.resolve("eslint-import-resolver-node")]: {
        extensions: [".js", ".jsx", ".ts", ".tsx"],
      },
      [require.resolve("eslint-import-resolver-typescript")]: {
        alwaysTryTypes: true,
      },
    },
  },
  env: {
    browser: true,
    node: true,
  },
  reportUnusedDisableDirectives: true,
  ignorePatterns: [
    ".next",
    "dist",
    "pnpm-lock.yaml",
    "node_modules",
    "public",
    ".cache",
    "generated",
  ],
};
