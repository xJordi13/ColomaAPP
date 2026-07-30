async function main() {
  const response = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'profesorColoma@gmail.com',
      password: '12345',
    }),
  });

  console.log('status:', response.status);
  console.log('ok:', response.ok);
  console.log('body:', await response.text());
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
