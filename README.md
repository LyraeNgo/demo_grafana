

```
testhttps
├─ .agents
├─ .yamllint
├─ app
│  ├─ main.py
│  ├─ requirements.txt
│  ├─ run.py
│  └─ __init__.py
├─ docker-compose.yml
├─ dockerfile
├─ Frontend
│  ├─ dist
│  │  ├─ assets
│  │  │  ├─ index-CmZiebRy.js
│  │  │  └─ index-DwghWFKL.css
│  │  └─ index.html
│  ├─ Dockerfile
│  ├─ index.html
│  ├─ nginx.conf
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ README.md
│  ├─ src
│  │  ├─ App.jsx
│  │  ├─ main.jsx
│  │  └─ styles.css
│  └─ vite.config.js
├─ grafana
│  ├─ dashboards
│  │  └─ dashboard.json
│  └─ provisioning
│     ├─ alerting
│     │  ├─ alert-rules.yml
│     │  ├─ contact-points.yml
│     │  └─ notification-policies.yml
│     ├─ dashboards
│     │  └─ dashboard.yml
│     └─ datasources
│        └─ datasource.yml
├─ k8s
│  ├─ argocd
│  │  └─ application.yaml
│  ├─ Chart.yaml
│  ├─ templates
│  │  ├─ backend
│  │  │  ├─ deployment.yaml
│  │  │  ├─ secret.yaml
│  │  │  └─ service.yaml
│  │  ├─ mongodb
│  │  │  ├─ secret.yaml
│  │  │  ├─ service.yaml
│  │  │  └─ statefulset.yaml
│  │  ├─ namespace.yaml
│  │  ├─ nginx
│  │  │  ├─ configmap.yaml
│  │  │  ├─ deployment.yaml
│  │  │  └─ service.yaml
│  │  └─ _helpers.tpl
│  └─ values.yaml
├─ nginx
│  ├─ about.html
│  ├─ index.html
│  └─ nginx.conf
├─ prometheus.yml
├─ promtail-config.yml
├─ README.md
├─ tempo.yaml
└─ test.js

```