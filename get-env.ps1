$vars = [Environment]::GetEnvironmentVariables('User')
foreach ($key in $vars.Keys) {
    if ($key -like '*telegram*' -or $key -like '*bot*') {
        Write-Host "$key = $($vars[$key])"
    }
}
