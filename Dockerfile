# Usa la imagen oficial de Nginx
FROM nginx:alpine

# Elimina los archivos por defecto de nginx
RUN rm -rf /usr/share/nginx/html/*

# Copia tu HTML al directorio donde Nginx busca contenido
COPY index.html /usr/share/nginx/html/

# Expone el puerto 80
EXPOSE 80
