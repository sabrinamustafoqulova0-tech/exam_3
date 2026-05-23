async function test() {
  const url = "https://instagram-api.softclub.tj/Account/login";
  
  // Test case 1: sending userName (camelCase)
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userName: "orzudilovar11", password: "somepassword" })
    });
    console.log("userName status:", res.status);
    console.log("userName response:", await res.text());
  } catch (e) {
    console.error("userName failed", e);
  }

  // Test case 2: sending username (lowercase)
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "orzudilovar11", password: "somepassword" })
    });
    console.log("username status:", res.status);
    console.log("username response:", await res.text());
  } catch (e) {
    console.error("username failed", e);
  }
}

test();
