var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure CORS for local development
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Configure middleware
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");
app.UseAuthorization();
app.MapControllers();

// Configure URLs
app.Urls.Add("http://localhost:5001");

Console.WriteLine("╔════════════════════════════════════════════════════════════╗");
Console.WriteLine("║   FINGERPRINT WEB SERVICE                                  ║");
Console.WriteLine("║   Running on: http://localhost:5001                        ║");
Console.WriteLine("╚════════════════════════════════════════════════════════════╝");
Console.WriteLine();
Console.WriteLine("API Endpoints:");
Console.WriteLine("  GET  /status          - Device status");
Console.WriteLine("  POST /enroll          - Enroll new user");
Console.WriteLine("  POST /verify          - Verify fingerprint");
Console.WriteLine();

app.Run();
