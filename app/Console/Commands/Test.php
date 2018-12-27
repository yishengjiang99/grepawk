<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Collection;
class Test extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 't';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Command description';

    /**
     * Create a new command instance.
     *
     * @return void
     */
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     *
     * @return mixed
     */
    public function handle()
    {
        //
        $collection = collect(['first', 'second']);
        
        $upper = $collection->toUpper();
        var_dump($upper);
        $collection = collect([1, 2]);
        $matrix = $collection->crossJoin(['a', 'b']);
        $collection = collect([1, 2, 3, 4, 5]);
        
        $diff = $collection->diff([2, 4, 6, 8]);
        $diff->dd();
    }
}
