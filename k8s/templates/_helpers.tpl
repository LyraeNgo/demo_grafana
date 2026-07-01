{{/*
============================================================
Helpers chung cho toàn bộ Helm chart
============================================================
*/}}

{{/*
Chart name + version (dùng trong labels)
*/}}
{{- define "chaters.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels - áp dụng cho mọi resource
*/}}
{{- define "chaters.labels" -}}
helm.sh/chart: {{ include "chaters.chart" . }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Selector labels cho Backend
*/}}
{{- define "chaters.backend.selectorLabels" -}}
app.kubernetes.io/name: backend
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Selector labels cho MongoDB
*/}}
{{- define "chaters.mongodb.selectorLabels" -}}
app.kubernetes.io/name: mongodb
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Selector labels cho Nginx
*/}}
{{- define "chaters.nginx.selectorLabels" -}}
app.kubernetes.io/name: nginx
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
