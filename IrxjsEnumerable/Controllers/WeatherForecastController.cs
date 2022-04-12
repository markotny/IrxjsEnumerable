using Microsoft.AspNetCore.Mvc;
using System.Runtime.CompilerServices;

namespace IrxjsEnumerable.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class WeatherForecastController : ControllerBase
    {
        private static readonly string[] Summaries = new[]
        {
        "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
    };

        private readonly ILogger<WeatherForecastController> _logger;

        public WeatherForecastController(ILogger<WeatherForecastController> logger)
        {
            _logger = logger;
        }

        [HttpGet]
        public async IAsyncEnumerable<WeatherForecast> Get([EnumeratorCancellation] CancellationToken cancellationToken)
        {
            for (var index = 0; !cancellationToken.IsCancellationRequested; index++)
            {
                await Task.Delay(1000, cancellationToken);

                yield return new WeatherForecast
                {
                    Date = DateTime.Now.AddDays(index),
                    TemperatureC = Random.Shared.Next(-20, 55),
                    Summary = Summaries[Random.Shared.Next(Summaries.Length)]
                };
            }
        }
    }
}