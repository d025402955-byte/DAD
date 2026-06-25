const express = require('express');
const axios = require('axios');
const { parse } = require('csv-parse/sync');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', async (req, res) => {
  try {
    const { dateF, dateT } = req.query;

    // בדיקת פרמטרים
    if (!dateF || !dateT) {
      return res.type('text/plain; charset=utf-8').send("id_list_message=t-חסרים פרמטרים dateF או dateT,&");
    }

    const url = `https://icom.yaad.net/p/?action=exportXLS&from=UserPage&Masof=3500027220&User=QGAWH&Pass=AMDR102030405&dateF=${dateF}&dateT=${dateT}`;

    // משיכת הנתונים מהשרת של יעד
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    
    // פענוח ה-CSV בפורמט UTF-8
    const csvText = response.data.toString('utf-8');
    
    // פארסינג של ה-CSV למערך של מערכים
    const data = parse(csvText, { columns: false, skip_empty_lines: true });

    if (data.length < 2) {
      return res.type('text/plain; charset=utf-8').send("id_list_message=t-אין נתונים,");
    }

    const headers = data[0];
    const amountCol = headers.indexOf("סכום");
    const currencyCol = headers.indexOf("מטבע");

    if (amountCol === -1 || currencyCol === -1) {
      return res.type('text/plain; charset=utf-8').send("id_list_message=t-לא נמצאו עמודות סכום או מטבע,");
    }

    let totalILS = 0;
    let totalUSD = 0;

    for (let i = 1; i < data.length; i++) {
      const amount = parseFloat(data[i][amountCol]) || 0;
      const currency = String(data[i][currencyCol]).trim();

      if (currency === "1") {
        totalILS += amount;
      } else if (currency === "2") {
        totalUSD += amount;
      }
    }

    // פונקציית העזר שלך להחלפת הנקודה העשרונית למילים בשביל המקריא הטלפוני
    function formatNumber(num) {
      return String(num).replace(".", " נקודה ");
    }

    let result = [];

    if (totalILS > 0) {
      result.push(formatNumber(totalILS) + " שקלים");
    }

    if (totalUSD > 0) {
      result.push(formatNumber(totalUSD) + " דולרים");
    }

    const output = result.length
      ? "id_list_message=t-סך הכל " + result.join(", ") + ",&"
      : "id_list_message=t-אין שקלים/דולרים,";

    return res.type('text/plain; charset=utf-8').send(output);

  } catch (err) {
    return res.type('text/plain; charset=utf-8').send("id_list_message=t-שגיאה: " + err.message + ",");
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
