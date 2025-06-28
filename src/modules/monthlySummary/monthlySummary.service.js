const { Op } = require('sequelize');
const { MonthlySummary, User, Transaction } = require('../../../models');
const NotFound = require('../../errors/NotFoundError');
const BadRequestError = require('../../errors/BadRequestError');
const config = require('../../config/config');

class MonthlySummaryService {
    async getAll() {
        return await MonthlySummary.findAll();
    }

    async getById(id) {
        const summary = await MonthlySummary.findByPk(id);
        if (!summary) throw new NotFound('Summary bulanan tidak ditemukan!');
        return summary;
    }

    async create(data) {
        return await MonthlySummary.create(data);
    }

    async update(id, data) {
        const summary = await MonthlySummary.findByPk(id);
        if (!summary) throw new NotFound('Summary bulanan tidak ditemukan!');
        await summary.update(data);
        return summary;
    }

    async delete(id) {
        const summary = await MonthlySummary.findByPk(id);
        if (!summary) throw new NotFound('Summary bulanan tidak ditemukan!');
        await summary.destroy();
        return true;
    }

    async generate(userId) {
        const now = new Date();
        const month = now.toLocaleDateString("id-ID", { month: "long" });
        const year = now.getFullYear();

        const startOfMonth = new Date(year, now.getMonth(), 1);
        const endOfMonth = new Date(year, now.getMonth() + 1, 0);

        const startOfDay =  new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const endOfDay =  new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        
        const existing = await MonthlySummary.findOne({
            where: {
                user_id: userId,
                created_at: { [Op.gte]: startOfDay, [Op.lte]: endOfDay }
            },
        });

        if (existing) {
            throw new BadRequestError("Summary hari ini sudah di generate, coba lagi besok.");
        }

        const transaction = await Transaction.findAll({
            where: {
                user_id: userId,
                date: { [Op.between]: [startOfMonth, endOfMonth] }
            },
            includes: ["category"]
        });

        const user = await User.findByPk(userId);
        if (!user) throw new NotFound("Pengguna Tidak Ditemukan");

        let totalIncome = 0;
        let totalExpense = 0;

        const formattedTx = transaction.map((tx) => {
            const amount = parseInt(tx.amount);
            if (tx.type === "income") totalIncome += amount
            if (tx.type === "expense") totalExpense += amount

            return {
                type: tx.type === "income" ? "pemasukan" : "pengeluaran",
                category: tx.category?.name || "Lainnya",
                amount,
                date: tx.date.toISOString().split("T")[0]
            }
        });

        const payload = {
            user: user.name,
            month: `${month} ${year}`,
            transaction: formattedTx,
            total_income: totalIncome,
            total_expense: totalExpense
        };

        const body = {
            model: "meta-llama/llama-3.1-8b-instruct:free",
            messages: [
                {
                    role: "system",
                    content: `Posisikan Dirimu sebagai Ahli Keuangan dan Buat Ringkasan keuangan dari data JSON berikut.
                    Hasilkan dalam format JSON yang valid dan HARUS memiliki struktur seperti ini:
                    {
                        "summary": "string",
                        "recommendations": ["string","string","..."],
                        "trend_analysis": "string"
                    }
                    Gunakan bahasa Indonesia untuk isinya. Jangan ubah nama key apapun. dan jangan Tambahkan \`\`\`. dan jawab dengan format json.
                    `,
                },
                {
                    role: "user",
                    content: JSON.stringify(payload)
                }
            ]
        };

        const delay = (ms) => new Promise((res) => setTimeout(res, ms));
        let retries = 3;
        let response;

        while(retries > 0) {
            response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${config.llm.openRouter}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body),
            });

            if (response !== 249) break;

            await delay(3000);
            retries--;
        }

         if (!response.ok) {
            throw new BadRequestError("Terjadi kesalahan, Harap dicoba lagi");
         }

         const result = await response.json();

         const content = result.choices?.[0]?.message?.content || "";

         let parsed;

         //By Agrieva
        //  try {
        //     const cleaned = content.replace(/```json\s*|\s*```/g,"").trim();
        //     parsed = JSON.parse(cleaned);
            
        //     if(!parsed.summary || !parsed.recommendations || !parsed.trend_analysis) {
        //         throw new BadRequestError("Struktur JSON tidak lengkap"); 
        //     }
        //  } catch (error) {
        //     throw new BadRequestError("Gagal Mengurai Response JSON dari LLM, Harap Di Coba Lagi!");
        //  }


         // By Ryan
         // kalo ga dapet hasil dari AI nya bisa di cek di sini atau di otak atik di sini. soalnya balikan dari AI nya kadang beda formatnya
         try {
            // untuk menghilangkan karakter ```
            const cleaned = content.replace(/```json\s*|```/g, "").trim();
            // untuk menangkap awal dan akhir JSON object
            const match = cleaned.match(/{[\s\S]*}/);
            if (match) {
                try {
                    parsed = JSON.parse(match[0]);
                    if(!parsed.summary || !parsed.recommendations || !parsed.trend_analysis) {
                        throw new BadRequestError("Struktur JSON tidak lengkap"); 
                    }
                } catch (error) {
                    throw new BadRequestError("Gagal Mengurai Response JSON dari LLM, Harap Di Coba Lagi!");
                }
            } else {
                throw new BadRequestError("JSON Tidak Ditemukan")
            }
         } catch (error) {
            throw new BadRequestError("Gagal Mengurai Response JSON dari LLM, Harap Di Coba Lagi!");
         }

          const summary = await MonthlySummary.create({
            user_id: userId,
            month,
            year: String(year),
            total_income: String(totalIncome),
            total_expense: String(totalExpense),
            balance: String(totalIncome - totalExpense),
            ai_summary: parsed.summary,
            ai_recomendation: [...parsed.recommendations, parsed.trend_analysis].join("\n")
          });

          return {
            summary: parsed.summary,
            recommendations: parsed.recommendations,
            trend_analysis: parsed.trend_analysis
          }
    }
}

module.exports = new MonthlySummaryService();