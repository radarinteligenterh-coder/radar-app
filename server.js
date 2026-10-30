
import express from "express";
import cors from "cors";
import "dotenv/config";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    app: "RADAR",
    status: "Servidor funcionando"
  });
});

app.post("/api/search", async (req, res) => {
  try {
    const { origin, destination, departureDate, returnDate, passengers } = req.body;

    if (!origin || !destination || !departureDate || !passengers) {
      return res.status(400).json({
        error: "Informe origem, destino, data e passageiros."
      });
    }

    if (!process.env.DUFFEL_ACCESS_TOKEN) {
      return res.status(500).json({
        error: "Token da Duffel não configurado no servidor."
      });
    }

    const slices = [{
      origin,
      destination,
      departure_date: departureDate
    }];

    if (returnDate) {
      slices.push({
        origin: destination,
        destination: origin,
        departure_date: returnDate
      });
    }

    const response = await fetch(
      "https://api.duffel.com/air/offer_requests?return_offers=true",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.DUFFEL_ACCESS_TOKEN}`,
          "Duffel-Version": "v2",
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          data: {
            slices,
            passengers: Array.from(
              { length: Number(passengers) },
              () => ({ type: "adult" })
            ),
            cabin_class: "economy"
          }
        })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "A Duffel retornou um erro.",
        details: result
      });
    }

    res.json(result.data);
  } catch (error) {
    res.status(500).json({
      error: "Erro ao pesquisar voos.",
      details: error.message
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`RADAR rodando na porta ${PORT}`);
});
