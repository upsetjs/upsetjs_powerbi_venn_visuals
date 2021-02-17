# UpSet.js Venn Diagram as PowerBI Visual

[![Github Actions][github-actions-image]][github-actions-url]

This is a [PowerBI Custom Visual](https://powerbi.microsoft.com/en-us/developers/custom-visualization/?cdn=disable) for rendering [UpSet.js](https://upset.js.org) Venn Diagrams.

This package is part of the UpSet.js ecosystem located at the main [Github Monorepo](https://github.com/upsetjs/upsetjs).

![Venn Report](https://user-images.githubusercontent.com/4129778/85765896-d6417900-b716-11ea-8b89-8ae01f6456a0.png)

see also [Sample PBIX file](https://upset.js.org/integrations/powerbi/got_venn.pbix)

## Installation

Download the latest package from [https://upset.js.org/integrations/powerbi/upsetjs_venn.pbiviz](https://upset.js.org/integrations/powerbi/upsetjs_venn.pbiviz) and install into your PowerBI environment.

## Data Roles

The UpSet.js visual has two data roles:

- `Elements` exactly one grouping with a unique identifier for each row (e.g., a name)
- `Sets` one or more measures or groupings which represent the sets. When it's value at row `i` results in a trueish value (e.g., 1, true, ...) UpSet.js will interpret it that the element at row `i` is part of this set

In addition, the visual supports various styling options including the customization of whether a Venn or an Euler diagram should be generated.

## Interaction

The UpSet.js visual reacts to selections from other widgets by highlighting the elements in its chart. Moreover, when the user **clicks** on an element in the chart, the corresponding set (combination) will be selected.

## Dev Environment

see also https://docs.microsoft.com/en-us/power-bi/developer/visuals/environment-setup

```sh
npm i
cp src/secrets.example.json src/secrets.json
npm run pbiviz -- --install-cert
```

### Test Server

```sh
npm start
```

### Commands

```sh
npm run lint
npm run build
npm run release
```

### Submission

1. Create a new release
1. Update the sample dataset with the latest version
1. Send a mail to pbivizsubmit@microsoft.com.
   subject: Ultimate Venn Diagram vX.X.X
   content: ?
   attachments: the pbiviz and the sample report
1. Wait for app package XML response
1. Go to https://partner.microsoft.com/de-de/dashboard/office/products/dbd65d26-f58a-4ecb-be91-150f989612f0/packages and upload the new XML file
1. Check the package and Publish

## Privacy Policy

UpSet.js is a client only library. The library or any of its integrations doesn't track you or transfers your data to any server. The uploaded data in the app are stored in your browser only using IndexedDB. The Tableau extension can run in a sandbox environment prohibiting any server requests. However, as soon as you export your session within the app to an external service (e.g., Codepen.io) your data will be transferred.

## License / Terms of Service

### Commercial license

If you want to use Upset.js for a commercial application the commercial license is the appropriate license. Contact [@sgratzl](mailto:sam@sgratzl.com) for details.

### Open-source license

This library is released under the `GNU AGPLv3` version to be used for private and academic purposes. In case of a commercial use, please get in touch regarding a commercial license.

[github-actions-image]: https://github.com/upsetjs/upsetjs_powerbi_venn_visuals/workflows/ci/badge.svg
[github-actions-url]: https://github.com/upsetjs/upsetjs_powerbi_venn_visuals/actions
[codepen]: https://img.shields.io/badge/CodePen-open-blue?logo=codepen
