# Demo


## Prerequisites

### Docker

Install the CLI utility

    brew install docker

Then install the docker client:

<https://www.docker.com/docker-mac>


### Openshift 3

    brew install openshift-cli


## Setup

### Docker

1.  Insecure Registries

    In your docker client preferences, under the daemon section, add 172.30.0.0/16 to the list of insecure registries.

2.  Docker Resources

    In your docker client preferences, under the advanced section, set Memory to 4gb.

## Running

To generate all the files necessary to spin up a fresh demo instance, run the demo script below.

    ./demo.sh

Note: If you're running this script for the first time, the process can be quite lengthy. On a 2015 Macbook Pro, it 30 minutes to pull down and build all the necessary images.

