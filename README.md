# PubHubs Calendar

PubHubs (Public Hubs) is a European community network built on public values: openness, transparency and collective stewardship. It connects people across local hubs (i.e. neighbourhoods, sports clubs, schools, museums, patient organisations, libraries, municipalities) while protecting participants’ data and enabling trustworthy communication.

PubHubs Calendar is a cloned repository of PubHubs that implements a Calendar function over the Matrix protocol to allow people in local hubs to coordinate events entirely within PubHubs, without relying on external services.
This project is made as part of the student-run company in Radboud University.

---

## Contact & quick links

- GiPHouse: [https://giphouse.nl/](https://giphouse.nl/)
- PubHubs GitHub Repository: [https://github.com/PubHubs/PubHubs](https://github.com/PubHubs/PubHubs)
- PubHubs website / info: [https://pubhubs.net](https://pubhubs.net)
- If you want to get involved or test: please contact the PubHubs team via their website.

---
<!-- 
## Current status

This project is **in active development** and moving through test phases. The repository is a mirror of internal work and may be subject to major changes before a stable release. If you or your organisation want to help test or contribute, contact the team first.

--- -->

## Architecture

- **PubHubs central** — Central authentication and identity management (issues pseudonyms to hubs). Implemented in Rust.
- **Global client** — Web client that navigates between hubs (embeds hub clients via iframe). Implemented in TypeScript + Vue.
- **Hub servers** — Customised Matrix homeservers (based on Synapse) extended with PubHubs Python modules; by default hubs are not federated inside PubHubs.
- **Hub clients** — Matrix-based clients embedded in the Global Client with PubHubs-specific features (secured rooms, attribute-based access). Implemented in TypeScript + Vue.
- **Identity / attributes** — Handled by [Yivi](https://yivi.app) (used for login and attribute-based access).

---

### Important files & directories

| Path / Name                       | Type | Purpose                                                            | Notes                                                    |
| --------------------------------- | ---: | ------------------------------------------------------------------ | -------------------------------------------------------- |
| [flake.nix](./flake.nix)          | file | Nix flake with reproducible developer environment and dependencies | Use this to create dev shells.                           |
| [docker_yivi](./docker_yivi/)`    |  dir | Docker build files for the Yivi image                              | Builds the Yivi server used for attribute-based acccess. |
| [global-client](./global-client/) |  dir | Global client source (TypeScript + Vue)                            | Embeds hub clients via iframe.                           |
| [hub-client](./hub-client/)       |  dir | Hub client source (TypeScript + Vue)                               | Matrix client customisations.                            |
| [pubhubs](./pubhubs/)             |  dir | PubHubs Central (Rust)                                             | Central login & identity platform.                       |
| [pubhubs_hub](./pubhubs_hub/)     |  dir | Hub server build / Synapse extensions (Python)                     | Matrix server modules & hub configuration.               |

> [!Warning] Placement note
> Do not place this repository inside a folder managed by home-manager’s impermanence feature — that can cause permission problems for test hub data and local services.

---

# Developer quickstart

### 1. Clone the repo

```sh
git clone https://github.com/GiPHouse/PubHubs-Calendar.git
```

### 2. Install dependencies

See the [Nix flake](./flake.nix) for the required dependencies and their version. You can use the Nix package manager to install these, or install them manually.

With Nix installed, use the following command to enter a development shell:

```sh
# If using Nix:
nix develop

# Or, with direnv enabled:
direnv allow
```

For non-Nix users or those unfamiliar with Nix, these dependencies can be installed manually from the following sources:

- Docker: [https://docs.docker.com/engine/install](https://docs.docker.com/engine/install)
- NodeJS and the node package manager (npm): [https://nodejs.org/en/download](https://nodejs.org/en/download)
- Cargo and Rust: [https://rust-lang.org/tools/install/](https://rust-lang.org/tools/install/)
- Mask: [https://github.com/jacobdeichert/mask/](https://github.com/jacobdeichert/mask#installation)
- Irma: [https://github.com/privacybydesign/irmago/](https://github.com/privacybydesign/irmago#installing)
- Git Bash (for Windows users): [https://git-scm.com/install/windows](https://git-scm.com/install/windows)

Make sure you also have the Yivi app installed on your phone: [https://yivi.app/en/](https://yivi.app/en/)

### 3. Development commands

We use the the [Mask CLI task runner](https://github.com/jacobdeichert/mask) to document and provide shortcuts to the development commands we use. See the [Maskfile](./maskfile.md) for all available commands, or run `mask run help` to see what is available.

> On Windows, make sure to run these in Git bash, instead of the normal terminal.

#### On first use

on first use, we need to run some commands to install dependencies and set up some directories:

```sh
mask run init
```

```sh
npm install
```

This will setup all Node modules and install our pre-commit hook that handles formatting before committing.

Now you're ready to start developing.

### 4. What needs to be running

PubHubs consists of two main components:

1. `Pubhubs Central`, which manages the global login

   - [./pubhubs](./pubhubs/) folder contains the backend
   - [./global-client](./global-client/) folder contains the client

2. The `Hubs`, which run the Synapse server and Matrix client
   - [/pubhubs_hub](./pubhubs_hub/) folder contains the synapse server
     - [/pubhubs_hub/testhub[0-4]](./pubhubs_hub/testhub0) folders contain the test hubs
   - [/hub-client](./hub-client/) folder contains the hub client

To run the local development, you need to run six things locally:

- The Yivi server `mask run yivi`
- The Garage S3 server, `mask run s3`
- The PubHubs central server `mask run servers`
- The PubHubs central client `mask run client`
- The Hub server(s) `mask run hub server [0-4]`
- The Hub client(s) `mask run hub client [0-4]`

You can run these all at once in the following way:

```sh
mask run all
```
<!-- 
Alternatively, if you are only making changes to the hub, you can run the hub client against our [staging server](https://main.pubhubs.ihub.ru.nl). To do so, you can run:

```sh
mask run hub mainclient
```

This will run the hub client at port `8001`, but to access it you need a url with an access token. You can get this by running:

```sh
mask run hub mainclient enter
```

This will show a QR-code in the terminal, which can be scanned with your Yivi app (see next section). Once registered, you'll get a URL with the access token.
  -->
### 5. Logging in

The site should be accessible in a browser at (http://localhost:8080/)[http://localhost:8080/]

To access the hubs, you have to login using the Yivi app. To do so, the app must be set to developer mode. This can be done by navigating to the `more` menu and clicking the 'App Id' a couple of times.

#### Making yourself admin

After the first login on your local development, there won't be any rooms in the hub yet. To make these, you'll first have to make yourself admin of the hub. To do so, go to the folder of the running hub (ex. `./pubhubs_hub/testhub0`) and run the following:

```sh
sudo sqlite3 homeserver.db

# Inside sqlite
UPDATE users SET admin = 1; # Note that this will make all the existing users admin, use 'WHERE' to specify

# Afterwards, quit with ctrl + d, or:
quit;
```

After doing this, restart the hub server, or close `mask run all` and run it again.

### 6. Solutions for common issues

- If Yivi cannot communicate with your local development setup, disable your firewall.
- If you run into CORS issues, disable HTPPS-only in your browser.
- If the page at [localhost:8001](http://localhost:8001/) does not bring you to the PubHubs page, try with [localhost:8080](http://localhost:8080/) instead.
- If the hub does not appear, there may be other containers running on the same port. It often helps to close all Docker instances, including the ones from PubHubs, and run `mask run init` again before attempting `mask run all`.

---
<!-- 
## Further documentation & changelog

- Changelog: [CHANGELOG.md](./CHANGELOG.md)
  -->