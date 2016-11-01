/**
 * Created by kestas on 8/16/2016.
 */

function render_navigator(workspace_dir)
{
    $.post('/api/parseDir',{workspace:workspace_dir},function(data)
    {

    });
}