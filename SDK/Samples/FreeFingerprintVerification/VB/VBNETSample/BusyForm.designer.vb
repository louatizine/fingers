Namespace Neurotec.Gui
	Partial Class BusyForm
		''' <summary>
		''' Required designer variable.
		''' </summary>
		Private components As System.ComponentModel.IContainer = Nothing

		''' <summary>
		''' Clean up any resources being used.
		''' </summary>
		''' <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
		Protected Overloads Overrides Sub Dispose(disposing As Boolean)
			If disposing AndAlso (components IsNot Nothing) Then
				components.Dispose()
			End If
			MyBase.Dispose(disposing)
		End Sub

		#Region "Windows Form Designer generated code"

		''' <summary>
		''' Required method for Designer support - do not modify
		''' the contents of this method with the code editor.
		''' </summary>
		Private Sub InitializeComponent()
			Me.progressBar = New System.Windows.Forms.ProgressBar()
			Me.pnlMain = New System.Windows.Forms.Panel()
			Me.btnCancel = New System.Windows.Forms.Button()
			Me.lblOperation = New System.Windows.Forms.Label()
			Me.pnlMain.SuspendLayout()
			Me.SuspendLayout()
			' 
			' progressBar
			' 
			Me.progressBar.Location = New System.Drawing.Point(9, 53)
			Me.progressBar.Name = "progressBar"
			Me.progressBar.Size = New System.Drawing.Size(330, 12)
			Me.progressBar.Style = System.Windows.Forms.ProgressBarStyle.Continuous
			Me.progressBar.TabIndex = 0
			' 
			' pnlMain
			' 
			Me.pnlMain.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle
			Me.pnlMain.Controls.Add(Me.btnCancel)
			Me.pnlMain.Controls.Add(Me.lblOperation)
			Me.pnlMain.Controls.Add(Me.progressBar)
			Me.pnlMain.Dock = System.Windows.Forms.DockStyle.Fill
			Me.pnlMain.Location = New System.Drawing.Point(0, 0)
			Me.pnlMain.Name = "pnlMain"
			Me.pnlMain.Size = New System.Drawing.Size(352, 116)
			Me.pnlMain.TabIndex = 2
			' 
			' btnCancel
			' 
			Me.btnCancel.Location = New System.Drawing.Point(264, 81)
			Me.btnCancel.Name = "btnCancel"
			Me.btnCancel.Size = New System.Drawing.Size(75, 23)
			Me.btnCancel.TabIndex = 3
			Me.btnCancel.Text = "Cancel"
			Me.btnCancel.UseVisualStyleBackColor = True
			Me.btnCancel.Visible = False
			' 
			' lblOperation
			' 
			Me.lblOperation.Anchor = CType(((System.Windows.Forms.AnchorStyles.Bottom Or System.Windows.Forms.AnchorStyles.Left)), System.Windows.Forms.AnchorStyles)
			Me.lblOperation.Location = New System.Drawing.Point(9, 8)
			Me.lblOperation.Name = "lblOperation"
			Me.lblOperation.Size = New System.Drawing.Size(330, 42)
			Me.lblOperation.TabIndex = 2
			Me.lblOperation.Text = "Please wait..."
			' 
			' BusyForm
			' 
			Me.AcceptButton = Me.btnCancel
			Me.AutoScaleDimensions = New System.Drawing.SizeF(6F, 13F)
			Me.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font
			Me.BackColor = System.Drawing.Color.White
			Me.ClientSize = New System.Drawing.Size(352, 116)
			Me.Controls.Add(Me.pnlMain)
			Me.FormBorderStyle = System.Windows.Forms.FormBorderStyle.None
			Me.Name = "BusyForm"
			Me.ShowIcon = False
			Me.ShowInTaskbar = False
			Me.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen
			Me.Text = "SplashForm"
			Me.TopMost = True
			AddHandler Me.Shown, New System.EventHandler(AddressOf Me.BusyForm_Shown)
			Me.pnlMain.ResumeLayout(False)
			Me.ResumeLayout(False)

		End Sub

		#End Region

		Private progressBar As System.Windows.Forms.ProgressBar
		Private pnlMain As System.Windows.Forms.Panel
		Private lblOperation As System.Windows.Forms.Label
		Private btnCancel As System.Windows.Forms.Button
	End Class
End Namespace
