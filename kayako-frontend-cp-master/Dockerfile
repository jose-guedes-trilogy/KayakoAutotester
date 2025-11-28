FROM node:7.10.1-alpine

#ENV NODE_ENV=production

RUN set -x \
    && . /etc/os-release \
    && case "$ID" in \
        alpine) \
            # Install build tools, will be needed 
            apk add --no-cache bash git openssh python make gcc g++  \
            ;; \
        debian) \
            apt-get update \
            && apt-get -yq install bash git openssh-server python make gcc g++ libcrypto1.0 libgcc libstdc++ \
            && apt-get -yq clean \
            && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* \
            ;; \
    esac
# Install pre-compiled wartchman binaries
# BASED ON https://github.com/IcaliaLabs/docker-watchman
COPY --from=icalialabs/watchman:4-alpine3.4 /usr/local/bin/watchman* /usr/local/bin/
RUN mkdir -p /usr/local/var/run/watchman \
 && touch /usr/local/var/run/watchman/.not-empty
COPY --from=icalialabs/watchman:4-alpine3.4 /usr/local/share/doc/watchman* /usr/local/share/doc/


WORKDIR /kayako
RUN chown -R node /kayako
RUN chown -R node /usr/local
#Switch to node user, to avoid problems
USER node
# install yarn, if needed (only applies to older versions, like 6 or 7)
RUN yarn bin || ( npm install --global yarn@1.22.17 && npm cache clean ) \
    # show installed application versions (This can optionally be removed)
    && git --version && bash --version && ssh -V && npm -v && node -v && yarn -v && python2 -V 


COPY ["package.json", "package-lock.json*","yarn.lock", "npm-shrinkwrap.json*", "./"]
# Strange but necessary permission hack
USER root
RUN chown -R node ./yarn.lock
USER node
RUN yarn global add bower@1.8.12 --prefix /usr/local 
RUN yarn
# --production --silent && mv node_modules ../
COPY . .
EXPOSE 4200
EXPOSE 7020

RUN bower install
CMD ["npm", "run", "localdev"]
#"ember s -H 0.0.0.0 --ssl false --proxy https://brewfictus.local --secure-proxy false"