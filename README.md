# RAIZ — Farm Analysis DST

**Agroecological Decision Support Tool**  
RAIZ Project — Resilience Building through Agroecological Intensification in Zimbabwe

---

## What it is

A fully offline, single-file HTML decision support tool for Extension Service Agents
working with smallholder farm households. It allows agents to:

- Define a farming environment (calendar, crops, member types, cropping systems) as a **Project**
- Record household farm data as **Farm Profiles** within a project
- Calculate food security, economic resilience, and labour balance per household
- Simulate alternative crop plans and compare them with the current baseline
- Export results as CSV for research analysis

Runs in any modern browser (Chrome, Firefox) on desktop, tablet, or Android phone.
No internet connection required after the file is opened. No data is sent anywhere.

---

## Live version

**👉 https://guillaume-bruelle.github.io/raiz-dst/**

Open this URL directly in any browser — desktop, tablet, or Android phone.
No installation. No account. No data leaves your device.

---

## Download for offline use

If you need the file locally (e.g. for field use without any internet access):

1. Go to [`app/raiz_dst.html`](app/raiz_dst.html)
2. Click the **Download raw file** button (top-right of the file view)
3. Open the downloaded file in Chrome or Firefox

Once opened, the tool works entirely offline.

---

## Quick start

1. **📁 Projects** → create a project for your farming context
2. **⚙ Parameters** → define your calendar, crop products, member types, and cropping systems
3. **🌾 Farms** → create farm profiles and enter household data
4. **📋 Data Entry** → fill in composition, farm area, income sources, and crop plan
5. **▶ Run Analysis** → view food security, cash flow, and resilience results
6. **💾 Sessions & Export** → save your work and download CSV for research analysis

Full usage instructions and model equations are in the **📖 Guide** tab inside the tool.

---

## Data privacy

This tool stores all data locally in the browser (localStorage) on the device it runs on.
No data is transmitted to any server. No analytics, no tracking, no ads.
Field agent data never touches GitHub or any external service.

---

## Repository structure

```
app/             Working application — always the latest version
versions/        Frozen snapshots of each major and minor release
docs/            Model equation reference for citation and replication
CHANGELOG.md     Plain-language version history
```

---

## Versioning

Version numbers follow the pattern `vMAJOR.MINOR.PATCH`:

| Change type | Example | When to use |
|---|---|---|
| Patch | v1.0 → v1.0.1 | Bug fix, no change to model logic or data structure |
| Minor | v1.0 → v1.1 | New feature, model and data structure unchanged |
| Major | v1.x → v2.0 | Model equations or data structure changed |

Each major and minor release is archived as a frozen standalone file in `versions/`.

---

## Model reference

The full equation set used in the calculation engine is documented in
[`docs/model_equations.md`](docs/model_equations.md).

---

## Contributing

This repository is currently maintained by a single researcher.
Issues and suggestions are welcome via the [Issues](../../issues) tab.
Please open an issue before submitting a pull request.

---

## Citation

If you use this tool in research, please cite it as:

CIRAD, University of Zimbabwe, CIMMYT (2025). *RAIZ Farm Analysis DST — Agroecological
Decision Support Tool*. Developed by Bruelle, G. GitHub. https://github.com/guillaume-bruelle/raiz-dst  
ORCID: https://orcid.org/0000-0002-8390-419X

Produced with the financial assistance of the European Union through the RAIZ Project
(Grant No. CTR FOOD/2021/424-933). The contents are the sole responsibility of CIRAD,
University of Zimbabwe and CIMMYT, and do not reflect the position of the European Union.

---

## License

[CeCILL-B Free Software License](LICENSE) — a permissive French open source license
created by CEA, CNRS, and Inria, governed by French law.

You are free to use, modify, and distribute this tool, including for commercial purposes,
provided the original copyright and license notice are retained.
