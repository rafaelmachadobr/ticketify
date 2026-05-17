FROM kong:3.7-ubuntu

# Copia o plugin customizado para o diretório de plugins do Kong
COPY plugins/jwt-claims-injector /usr/local/share/lua/5.1/kong/plugins/jwt-claims-injector

USER root
RUN chown -R kong:kong /usr/local/share/lua/5.1/kong/plugins/jwt-claims-injector
USER kong
