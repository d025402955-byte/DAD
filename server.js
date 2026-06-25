const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', async (req, res) => {
  try {
    // שליפת פרמטר ה-url (הקישור לגוגל סקריפט)
    const targetUrl = req.query.url;
    
    // אם לא נשלח קישור יעד, נחזיר שגיאה מסודרת לימות המשיח
    if (!targetUrl) {
      return res.type('text/plain; charset=utf-8').send("id_list_message=t-שגיאה: חסר פרמטר url,&");
    }

    // יצירת עותק של כל הפרמטרים ומחיקת פרמטר ה-url כדי שלא יישלח לגוגל כנתון
    const params = { ...req.query };
    delete params.url;

    // בניית המחרוזת של שאר הפרמטרים
    const queryString = new URLSearchParams(params).toString();
    
    // חיבור הקישור של גוגל עם שאר הפרמטרים
    const finalUrl = targetUrl + (targetUrl.includes('?') ? '&' : '?') + queryString;

    // פנייה לכתובת הסופית (כולל מעקב אחרי ההפניות של גוגל)
    const response = await axios.get(finalUrl, { maxRedirects: 5 });
    
    // החזרת התשובה מגוגל ישירות למערכת הטלפונית
    return res.type('text/plain; charset=utf-8').send(String(response.data));
    
  } catch (err) {
    return res.type('text/plain; charset=utf-8').send("id_list_message=t-שגיאת שרת פרוקסי: " + err.message + ",");
  }
});

app.listen(PORT, () => console.log(`Dynamic Proxy server running on port ${PORT}`));
