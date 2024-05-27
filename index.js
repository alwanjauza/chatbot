const express = require("express");
const { Client, MessageMedia, RemoteAuth } = require("whatsapp-web.js");
const app = express();
const cors = require("cors");
const dotenv = require("dotenv");
const axios = require("axios");
const mongoose = require("mongoose");
const { MongoStore } = require("wwebjs-mongo");
const { log } = require("console");
const server = require("http").Server(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:3001",
    methods: ["GET", "POST"],
    credentials: true,
  },
  allowEIO3: true,
});
const nomorhpdefault = require("./model/nomorHP");
const categoryRoutes = require("./routes/categoriesRoute");
const repliesRoutes = require("./routes/repliesRoute");

let qrString;
let client;
let status_socket = false;
let store;
let nomorhpinput;

const chatbotUrl = "http://localhost:3008/api";

dotenv.config();
const databaseUrl = process.env.MONGODB_URI;
mongoose.connect(databaseUrl).then(() => {
  store = new MongoStore({ mongoose: mongoose });
});
const database = mongoose.connection;

database.once("connected", () => {
  console.log("connected to MongoDB database");
});

const port = process.env.PORT || 3008;
server.listen(port, () => {
  log(`Server running on port ${port}`);
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const ceknomor = nomorhpdefault.findOne({});
ceknomor.then(async (data) => {
  if (data) {
    console.log(
      `Nomor hp ditemukan: ${data.phonenumber}, mohon tunggu sebentar...`
    );
    const nomorlogin = data.phonenumber;
    loadWhatsappSession(nomorlogin);
  } else {
    console.log("Nomor hp tidak ditemukan, mohon login terlebih dahulu");
  }
});

const delay = 4000;

app.use(cors());
app.use(express.json());

app.use("/api/categories", categoryRoutes);
app.use("/api/replies", repliesRoutes);

const createWhatsappSession = (nomorhp, socket) => {
  console.log("bikin client baru whatsapp session");
  client = new Client({
    authStrategy: new RemoteAuth({
      store: store,
      backupSyncIntervalMs: 300000,
      clientId: nomorhp,
    }),
    puppeteer: {
      // executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
      executablePath:
        "C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe",
      // executablePath: '/usr/bin/google-chrome-stable',
    },
    webVersionCache: {
      type: "remote",
      remotePath:
        "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
    },
  });

  client.on("qr", (qr) => {
    qrString = qr;
    socket.emit("qr", { qrString });
  });

  client.on("authenticated", () => {
    console.log("Client authenticated using remote session!");
    const authenticated = true;
    socket.emit("authenticated", { authenticated });
  });

  client.on("remote_session_saved", () => {
    console.log("remote_session_saved on createWhatsappSession");
  });

  client.on("ready", () => {
    const connected = "Connect!!!";
    socket.emit("status", { connected });
    const newData = new nomorhpdefault({
      phonenumber: nomorhpinput,
    });
    newData.save();
  });

  client.initialize();
  chatbot(client);
};

const loadWhatsappSession = (nomorhp, socket) => {
  console.log("Loading client whatsapp session");
  client = new Client({
    authStrategy: new RemoteAuth({
      clientId: nomorhp,
      store: store,
      backupSyncIntervalMs: 300000,
    }),
    puppeteer: {
      // headless: true,
      //
      // executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
      executablePath:
        "C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe",
      // executablePath: '/usr/bin/google-chrome-stable',
    },
    webVersionCache: {
      type: "remote",
      remotePath:
        "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
    },
  });

  client.on("authenticated", () => {
    console.log("Client authenticated using remote session!");
  });

  client.on("ready", () => {
    const connected = "Connect!!!";
    if (socket) {
      socket.emit("status", { connected });
      console.log("Session restored and ready!");
    }
  });

  client.on("remote_session_saved", () => {
    console.log("remote_session_saved");
  });

  console.log("Before client.initialize()");
  client.initialize();
  chatbot(client);
};

io.on("connection", (socket) => {
  if (status_socket) {
    const connected = "Connect!!!";
    socket.emit("status", { connected });
  }

  const ceknomor = nomorhpdefault.findOne({});
  ceknomor.then(async (data) => {
    if (data) {
      const nomorlogin = data.phonenumber;
      socket.emit("nomorlogin", { nomorlogin });
    }
  });

  socket.on("login", (nomorhp) => {
    console.log("nomorHP: ", nomorhp);
    nomorhpinput = nomorhp.nomorhp;
    const ceknomor = nomorhpdefault.findOne({ phonenumber: nomorhpinput });
    ceknomor.then(async (data) => {
      if (data) {
        console.log(nomorhpinput + " data ditemukan");
        loadWhatsappSession(nomorhpinput, socket);
      } else {
        createWhatsappSession(nomorhpinput, socket);
      }
    });
  });

  socket.on("broadcast", async (phonenumbers) => {
    WhatsappBroadcast(phonenumbers, socket);
  });

  socket.on("signout", async () => {
    signoutWhatsappSession(socket);
  });
});

const signoutWhatsappSession = (socket) => {
  const ceknomor = nomorhpdefault.findOne({});
  let nomorhphapus;
  ceknomor.then(async (data) => {
    nomorhphapus = data.phonenumber.toString();
    console.log(nomorhphapus);
    mongoose.connection.db
      .collection(`whatsapp-RemoteAuth-${nomorhphapus}.chunks`)
      .drop();
    mongoose.connection.db
      .collection(`whatsapp-RemoteAuth-${nomorhphapus}.files`)
      .drop();
    await nomorhpdefault.deleteOne({ phonenumber: nomorhphapus });
  });

  client.on("disconnected", (reason) => {
    console.log("disconnet whatsapp-bot", reason);
  });

  client
    .destroy()
    .then(() => {
      console.log("Client disconnected successfully.");
      const logoutdone = true;
      socket.emit("logoutdone", { logoutdone });
    })
    .catch((error) => {
      console.error("Error while disconnecting:", error);
    });
};

const WhatsappBroadcast = async (phonenumbers, socket) => {
  const errors = [];

  for (let i = 0; i < phonenumbers.phonenumbers.length; i++) {
    const number = phonenumbers.phonenumbers[i];
    const sanitized_number = number.phone.toString().replace(/[- )(]/g, "");
    const percent = ((i + 1) / phonenumbers.phonenumbers.length) * 100;

    const message = phonenumbers.message.includes("contact_name")
      ? phonenumbers.message.replace(/contact_name/g, number.contact_name)
      : phonenumbers.message;
    try {
      const number_details = await client.getNumberId(
        sanitized_number + "@c.us"
      );
      let sentMessage;

      if (phonenumbers.media) {
        const media = await MessageMedia.fromUrl(phonenumbers.media, {
          unsafeMime: true,
        });

        sentMessage = await client.sendMessage(
          number_details._serialized,
          media,
          {
            caption: message,
          }
        );
      } else {
        sentMessage = await client.sendMessage(
          number_details._serialized,
          message
        );
      }
      const nama = number.contact_name;

      console.log(
        Number(i) + 1,
        "Message sent successfully to",
        number.contact_name
      );
      axios.post(
        "https://api.ibupembelajar.id/api-ipi/historybroadcast/",
        {
          title: phonenumbers.title,
          message: message,
          assign_group_id: phonenumbers.phonenumbers[i].id,
          is_delivered: true,
        },
        {
          headers: {
            Authorization: `Token ${phonenumbers.token}`,
          },
        }
      );
      socket.emit("sendsuccess", nama);
      socket.emit("percen", percent);
    } catch (error) {
      console.error(
        Number(i) + 1,
        "Error sending message to",
        number.contact_name,
        error
      );
      errors.push({
        index: i + 1,
        receiver: number.phone,
      });
      axios.post(
        "https://api.ibupembelajar.id/api-ipi/historybroadcast/",
        {
          title: phonenumbers.title,
          message: message,
          assign_group_id: phonenumbers.phonenumbers[i].id,
          is_delivered: false,
        },
        {
          headers: {
            Authorization: `Token ${phonenumbers.token}`,
          },
        }
      );
    }

    await sleep(delay);
  }

  if (errors.length > 0) {
    console.log(`${errors.length} errors during broadcast: `, errors);
  } else {
    console.log("Broadcast completed without errors");
  }
};

const chatbot = (client) => {
  let selectedCategory = null;

  client.on("message", async (msg) => {
    if (msg.body) {
      const lowerCaseMsg = msg.body.toLowerCase();

      if (lowerCaseMsg === "menu") {
        try {
          const categories = await axios.get(`${chatbotUrl}/categories`);
          const categoriesData = categories.data;

          if (categoriesData.length > 0) {
            let menu = "Menu:\n";
            categoriesData.forEach((category, index) => {
              menu += `${category?.name}\n`;
            });
            msg.reply(menu);
          } else {
            console.log("Sorry, there are no categories available.");
          }
        } catch (error) {
          console.error("Error fetching categories:", error);
          msg.reply("Sorry, there was an error fetching categories.");
        }
      } else if (selectedCategory === null) {
        try {
          const categories = await axios.get(`${chatbotUrl}/categories`);
          const categoriesData = categories.data;

          const matchingCategory = categoriesData.find(
            (category) => category.name.toLowerCase() === lowerCaseMsg
          );

          if (matchingCategory) {
            selectedCategory = matchingCategory;

            const response = await axios.get(
              `${chatbotUrl}/replies/${selectedCategory._id}`
            );
            const categoryReplies = response.data;

            let message = `${selectedCategory.name}:\n`;
            categoryReplies.forEach((reply, index) => {
              message += `${index + 1}. ${reply?.message}\n`;
            });

            msg.reply(message);
          } else {
            console.log("Invalid category selection.");
          }
        } catch (error) {
          console.error("Error fetching categories:", error);
          msg.reply("Sorry, there was an error fetching categories.");
        }
      } else {
        try {
          const response = await axios.get(`${chatbotUrl}/replies`);
          const replies = response.data;

          const matchingReply = replies.find(
            (reply) => reply.message.toLowerCase() === lowerCaseMsg
          );

          if (matchingReply) {
            msg.reply(matchingReply.reply);
          } else {
            console.log("Sorry, no matching reply found.");
          }

          selectedCategory = null;
        } catch (error) {
          console.error("Error fetching replies:", error);
          msg.reply("Sorry, there was an error fetching replies.");
        }
      }
    }
  });
};
