#!/bin/bash
# Execute all commands in root directory
cd ..

if ! hash oc 2>/dev/null; then
  printf "Please install openshift-cli. Example: \nbrew install openshift-cli";
  exit
fi

echo "Starting up oc cluster and logging you in"
oc cluster up

if [ "$?" -ne "0" ]; then
  exit
fi

oc login --username=developer --password=anypassword

# Create both projects
oc new-project tran-schoolbus-dev
oc new-project tran-schoolbus-tools

# Generate build template
oc process -f openshift/templates/schoolbus-build-template.json > schoolbus-build.json

# Create open shift resources
oc create -f schoolbus-build.json

echo "Building resources, this could take awhile"
oc get is

pods_built=$(oc get is | grep -c "latest")
start_time=$(date +"%s")
max_time=$(expr $start_time + 2700)
while [ "$pods_built" -lt "11" ]; do
  current_time=$(date +"%s")
  if [ "$current_time" -gt "$max_time" ]; then
    echo -e "\nProcess looks to be taking longer than expected."
    echo "Open up the admin web page and check for problems."
    exit
  fi
  echo -n "."
  sleep 3
  pods_built=$(oc get is | grep -c "latest")
done

echo "Tagging the dev applications..."

oc tag backup:latest backup:dev;oc tag client:latest client:dev;oc tag frontend:latest frontend:dev;oc tag mock:latest mock:dev;oc tag pdf:latest pdf:dev;oc tag s2i-nginx:latest s2i-nginx:dev;oc tag schema-spy:latest schema-spy:dev;oc tag server:latest server:dev;oc tag cerberus:latest cerberus:dev

echo "Setting permissions"

oc policy add-role-to-user system:image-puller system:serviceaccount:tran-schoolbus-dev:default -n tran-schoolbus-tools

oc project tran-schoolbus-dev

#copyign secrets over
current_directory=$PWD
mkdir /tmp/schoolbus
mkdir /tmp/schoolbus/secrets

cp ApiSpec/TestData/example_ccw.json /tmp/schoolbus/ccw.json
cp ApiSpec/TestData/example_users.json /tmp/schoolbus/secrets/users.json
cp ApiSpec/TestData/Regions/Regions_Region.json /tmp/schoolbus/secrets/regions.json
cp ApiSpec/TestData/Districts/Districts_District.json /tmp/schoolbus/secrets/districts.json

oc secrets new ccw-secret /tmp/schoolbus/ccw.json
oc secrets new schoolbus-secret /tmp/schoolbus/secrets

# Create deployment template
oc process -f openshift/templates/schoolbus-deployment-template.json >schoolbus-deployment.json
oc create -f schoolbus-deployment.json # Use same as output file in the previous command

# Delete postgres service, probably should find out why it needs to be deleted
oc delete dc postgresql
oc delete service postgresql

# Pull down image
# docker pull centos/postgresql-95-centos7

#get main server name
pg_user=$(oc env dc/server --list| grep POSTGRESQL_USER)
pg_user=${pg_user#*=}
pg_password=$(oc env dc/server --list | grep POSTGRESQL_PASSWORD)
pg_password=${pg_password#*=}

oc new-app postgresql \
   -e POSTGRESQL_USER=$pg_user \
   -e POSTGRESQL_PASSWORD=$pg_password \
   -e POSTGRESQL_DATABASE=schoolbus

# Generate route
oc expose service frontend

# Parse route
frontend="http://$(oc get routes | grep frontend | awk '{printf $2}')"


# Generating data
cd ./ApiSpec/TestData/
./load-all.sh "local"

# Getting auth token and then loading up main app
echo $frontend/api/authentication/dev/token/

if [ $uname="Darwin" ]; then
  echo -e "\n\nAuthorizing with dev token\n user"
  open $frontend/api/authentication/dev/token/SCURRAN
fi

sleep 3
echo $frontend

if [ $uname="Darwin" ]; then
  echo "Loading app"
  open $frontend
fi
